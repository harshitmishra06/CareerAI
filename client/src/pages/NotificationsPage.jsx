import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationApi } from '../services/api.js';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Briefcase,
  FileText,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 15, total: 0, totalPages: 1, unreadCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async (page = 1, onlyUnread = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationApi.getNotifications({
        page,
        limit: 15,
        unreadOnly: onlyUnread
      });
      setNotifications(res.data || []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err) {
      setError(err.message || 'Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(currentPage, unreadOnly);
  }, [currentPage, unreadOnly]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date() } : n))
      );
      setMeta((prev) => ({
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
      );
      setMeta((prev) => ({ ...prev, unreadCount: 0 }));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'APPLICATION_STATUS_CHANGED':
      case 'application_status':
        return <CheckCircle2 size={18} color="#3b82f6" />;
      case 'APPLICATION_RECEIVED':
      case 'new_application':
        return <Briefcase size={18} color="#10b981" />;
      case 'RESUME_ANALYSIS_COMPLETED':
      case 'resume_analysis':
        return <Sparkles size={18} color="#a855f7" />;
      case 'JOB_MATCH':
      case 'job_alert':
        return <FileText size={18} color="#f59e0b" />;
      default:
        return <Info size={18} color="#94a3b8" />;
    }
  };

  const getActionLink = (notification) => {
    const metaData = notification.metadata || {};
    if (metaData.applicationId) {
      return `/applications/${metaData.applicationId}`;
    }
    if (metaData.analysisId) {
      return `/resume-analysis/${metaData.analysisId}`;
    }
    if (metaData.jobId) {
      return `/jobs/${metaData.jobId}`;
    }
    return null;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1rem', maxWidth: '850px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: 'var(--text-primary)'
            }}
          >
            <Bell size={28} className="text-gradient" />
            Notifications
            {meta.unreadCount > 0 && (
              <span className="badge badge-primary" style={{ fontSize: '0.85rem' }}>
                {meta.unreadCount} new
              </span>
            )}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Stay informed on application updates, candidate responses, and AI matching insights.
          </p>
        </div>

        {meta.unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <CheckCheck size={16} />
            <span>{markingAll ? 'Marking...' : 'Mark all as read'}</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--glass-border)',
          paddingBottom: '0.75rem',
          marginBottom: '1.5rem'
        }}
      >
        <button
          onClick={() => {
            setUnreadOnly(false);
            setCurrentPage(1);
          }}
          className={`btn ${!unreadOnly ? 'btn-primary' : 'btn-glass'}`}
          style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}
        >
          All Notifications
        </button>
        <button
          onClick={() => {
            setUnreadOnly(true);
            setCurrentPage(1);
          }}
          className={`btn ${unreadOnly ? 'btn-primary' : 'btn-glass'}`}
          style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}
        >
          Unread Only {meta.unreadCount > 0 && `(${meta.unreadCount})`}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div
          className="card"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}
        >
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="card"
              style={{
                height: '80px',
                background: 'rgba(255, 255, 255, 0.02)',
                animation: 'pulse 1.5s infinite ease-in-out'
              }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && notifications.length === 0 && (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}
          >
            <Bell size={26} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No notifications found
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
            {unreadOnly
              ? "You've read all your notifications! Check back later for updates."
              : 'When you apply to jobs, receive status updates, or run AI analyses, you will see updates here.'}
          </p>
        </div>
      )}

      {/* Notifications list */}
      {!loading && !error && notifications.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {notifications.map((n) => {
            const isRead = n.isRead || Boolean(n.readAt);
            const actionLink = getActionLink(n);

            return (
              <div
                key={n._id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1.15rem 1.25rem',
                  position: 'relative',
                  borderLeft: isRead ? '1px solid var(--glass-border)' : '3px solid var(--primary-500)',
                  background: isRead ? 'rgba(255, 255, 255, 0.015)' : 'rgba(124, 58, 237, 0.05)',
                  transition: 'background 0.2s'
                }}
              >
                {/* Type Icon */}
                <div
                  style={{
                    padding: '0.55rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '0.15rem'
                  }}
                >
                  {getTypeIcon(n.type)}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      marginBottom: '0.25rem'
                    }}
                  >
                    <h4
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: isRead ? 600 : 700,
                        color: isRead ? 'var(--text-secondary)' : 'var(--text-primary)'
                      }}
                    >
                      {n.title}
                    </h4>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Clock size={12} />
                      {formatDate(n.createdAt)}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.45',
                      marginBottom: actionLink || !isRead ? '0.75rem' : '0'
                    }}
                  >
                    {n.message}
                  </p>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {actionLink && (
                      <Link
                        to={actionLink}
                        className="btn btn-glass"
                        style={{
                          fontSize: '0.775rem',
                          padding: '0.3rem 0.65rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <span>View Details</span>
                        <ArrowRight size={12} />
                      </Link>
                    )}

                    {!isRead && (
                      <button
                        onClick={() => handleMarkAsRead(n._id)}
                        className="btn btn-secondary"
                        style={{
                          fontSize: '0.775rem',
                          padding: '0.3rem 0.65rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <CheckCheck size={12} />
                        <span>Mark read</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '2rem'
          }}
        >
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="btn btn-glass"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0.5rem' }}>
            Page {currentPage} of {meta.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={currentPage >= meta.totalPages}
            className="btn btn-glass"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
