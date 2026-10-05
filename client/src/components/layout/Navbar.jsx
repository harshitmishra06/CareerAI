import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice.js';
import { notificationApi } from '../../services/api.js';
import {
  Cpu,
  LogOut,
  LayoutDashboard,
  LogIn,
  UserPlus,
  Sparkles,
  Zap,
  Bell,
  CheckCheck,
  CheckCircle2,
  Briefcase,
  Info,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function Navbar({ latency }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const apiStatus = useSelector((state) => state.ui.apiStatus);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  // Poll / fetch unread count when user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchBadge = async () => {
      try {
        const res = await notificationApi.getUnreadCount();
        if (res.data && typeof res.data.unreadCount === 'number') {
          setUnreadCount(res.data.unreadCount);
        }
      } catch (err) {
        // Silently catch background badge error
      }
    };

    fetchBadge();
    const interval = setInterval(fetchBadge, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Click outside listener for notification dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const toggleDropdown = async () => {
    const nextState = !showDropdown;
    setShowDropdown(nextState);

    if (nextState) {
      setLoadingNotifs(true);
      try {
        const res = await notificationApi.getNotifications({ page: 1, limit: 5 });
        setRecentNotifs(res.data || []);
        if (res.meta) {
          setUnreadCount(res.meta.unreadCount || 0);
        }
      } catch (err) {
        console.error('Failed to load recent notifications:', err);
      } finally {
        setLoadingNotifs(false);
      }
    }
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationApi.markAsRead(id);
      setRecentNotifs((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setRecentNotifs((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const dashboardPath =
    user?.role === 'recruiter' ? '/employer/dashboard' : '/dashboard';

  return (
    <header
      style={{
        borderBottom: '1px solid var(--glass-border)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(9, 13, 22, 0.85)'
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px'
        }}
      >
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--grad-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(124, 58, 237, 0.5)'
            }}
          >
            <Cpu size={22} color="#ffffff" />
          </div>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Career<span className="text-gradient">AI</span>
          </span>
          <span className="badge badge-primary" style={{ marginLeft: '0.5rem' }}>
            Phase 9
          </span>
        </Link>

        {/* Center Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link
            to="/jobs"
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
            onMouseEnter={(e) => (e.target.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.target.style.color = 'var(--text-secondary)')}
          >
            Find Jobs
          </Link>

          {isAuthenticated && user?.role === 'candidate' && (
            <>
              <Link
                to="/resumes"
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => (e.target.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.target.style.color = 'var(--text-secondary)')}
              >
                Resumes
              </Link>
              <Link
                to="/job-matches"
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
                onMouseEnter={(e) => (e.target.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.target.style.color = 'var(--text-secondary)')}
              >
                <Zap size={14} color="#a855f7" /> Matches
              </Link>
              <Link
                to="/applications"
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => (e.target.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.target.style.color = 'var(--text-secondary)')}
              >
                My Applications
              </Link>
              <Link
                to="/resume-analysis"
                style={{
                  color: '#c4b5fd',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'rgba(124, 58, 237, 0.15)',
                  border: '1px solid rgba(124, 58, 237, 0.35)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(124, 58, 237, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(124, 58, 237, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.35)';
                }}
              >
                <Sparkles size={14} color="#a855f7" /> AI Analyzer
              </Link>
            </>
          )}

          {isAuthenticated && (user?.role === 'recruiter' || user?.role === 'admin') && (
            <>
              <Link
                to="/employer/dashboard"
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => (e.target.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.target.style.color = 'var(--text-secondary)')}
              >
                Hiring Dashboard
              </Link>
              <Link
                to="/recruiter/jobs"
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => (e.target.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.target.style.color = 'var(--text-secondary)')}
              >
                My Jobs
              </Link>
              <Link
                to="/recruiter/company"
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => (e.target.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.target.style.color = 'var(--text-secondary)')}
              >
                Company
              </Link>
            </>
          )}
        </nav>

        {/* Right Nav: API Status, Notifications, Auth Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* API Health Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.825rem',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--glass-border)'
            }}
          >
            <span
              className={`status-indicator ${
                apiStatus === 'connected' ? 'online' : apiStatus === 'checking' ? 'checking' : 'offline'
              }`}
            />
            <span style={{ color: 'var(--text-secondary)' }}>
              {apiStatus === 'connected'
                ? `API Online (${latency ?? 5}ms)`
                : apiStatus === 'checking'
                ? 'Connecting...'
                : 'API Offline'}
            </span>
          </div>

          {/* Authenticated Controls */}
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
              {/* Notification Bell with Dropdown */}
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={toggleDropdown}
                  className="btn btn-glass"
                  style={{
                    padding: '0.45rem',
                    borderRadius: '8px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: '#ef4444',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
                      }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Panel */}
                {showDropdown && (
                  <div
                    className="card"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 10px)',
                      width: '350px',
                      maxHeight: '440px',
                      overflowY: 'auto',
                      padding: 0,
                      zIndex: 100,
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                      background: 'rgba(15, 23, 42, 0.98)',
                      borderColor: 'var(--glass-border)'
                    }}
                  >
                    {/* Dropdown Header */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.85rem 1rem',
                        borderBottom: '1px solid var(--glass-border)'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        Notifications {unreadCount > 0 && `(${unreadCount})`}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary-400)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notification List */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {loadingNotifs && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          Loading...
                        </div>
                      )}

                      {!loadingNotifs && recentNotifs.length === 0 && (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          <Bell size={24} style={{ opacity: 0.4, margin: '0 auto 0.5rem auto' }} />
                          <div style={{ fontSize: '0.85rem' }}>No notifications</div>
                        </div>
                      )}

                      {!loadingNotifs &&
                        recentNotifs.map((n) => {
                          const isRead = n.isRead || Boolean(n.readAt);
                          return (
                            <div
                              key={n._id}
                              style={{
                                padding: '0.85rem 1rem',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                background: isRead ? 'transparent' : 'rgba(124, 58, 237, 0.08)',
                                transition: 'background 0.2s',
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                if (!isRead) handleMarkAsRead(n._id);
                                setShowDropdown(false);
                                navigate('/notifications');
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span
                                  style={{
                                    fontSize: '0.85rem',
                                    fontWeight: isRead ? 500 : 700,
                                    color: isRead ? 'var(--text-secondary)' : 'var(--text-primary)'
                                  }}
                                >
                                  {n.title}
                                </span>
                                {!isRead && (
                                  <span
                                    style={{
                                      width: '7px',
                                      height: '7px',
                                      borderRadius: '50%',
                                      background: 'var(--primary-400)'
                                    }}
                                  />
                                )}
                              </div>
                              <p
                                style={{
                                  fontSize: '0.775rem',
                                  color: 'var(--text-muted)',
                                  marginTop: '0.2rem',
                                  lineHeight: '1.3'
                                }}
                              >
                                {n.message}
                              </p>
                            </div>
                          );
                        })}
                    </div>

                    {/* Dropdown Footer */}
                    <div
                      style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        borderTop: '1px solid var(--glass-border)'
                      }}
                    >
                      <Link
                        to="/notifications"
                        onClick={() => setShowDropdown(false)}
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--primary-400)',
                          textDecoration: 'none',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        View all notifications <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Post Job shortcut for recruiters */}
              {(user.role === 'recruiter' || user.role === 'admin') && (
                <Link
                  to="/recruiter/jobs/new"
                  className="btn btn-primary"
                  style={{
                    padding: '0.42rem 0.85rem',
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <span>+ Post Job</span>
                </Link>
              )}

              {/* User Dashboard Profile Button */}
              <Link
                to={dashboardPath}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.85rem'
                }}
              >
                <LayoutDashboard size={15} />
                <span>{user.name.split(' ')[0]}</span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    color: 'var(--primary-400)',
                    fontWeight: 700
                  }}
                >
                  [{user.role}]
                </span>
              </Link>

              {/* Sign Out Button */}
              <button
                onClick={handleLogout}
                className="btn btn-glass"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link
                to="/login"
                className="btn btn-glass"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.85rem'
                }}
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.85rem'
                }}
              >
                <UserPlus size={15} />
                <span>Get Started</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
