import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../store/slices/authSlice.js';
import { apiClient } from '../services/api.js';
import {
  ShieldCheck,
  UserCheck,
  Briefcase,
  LogOut,
  CheckCircle2,
  XCircle,
  KeyRound,
  Lock,
  Cpu,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardTestPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [testResult, setTestResult] = useState(null);
  const [testingEndpoint, setTestingEndpoint] = useState('');

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const testRbacEndpoint = async (roleType) => {
    setTestingEndpoint(roleType);
    setTestResult(null);

    try {
      const response = await apiClient.get(`/auth/test-role/${roleType}`);
      setTestResult({
        success: true,
        status: 200,
        message: response.message || `Authorized: Your ${user.role} role has access to this endpoint!`
      });
    } catch (err) {
      setTestResult({
        success: false,
        status: err.statusCode || 403,
        message: err.message || `Access denied: Role ${user.role} is not permitted.`
      });
    } finally {
      setTestingEndpoint('');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
            <ShieldCheck size={14} /> Administrator
          </span>
        );
      case 'recruiter':
        return (
          <span className="badge badge-primary" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
            <Briefcase size={14} /> Recruiter
          </span>
        );
      default:
        return (
          <span className="badge badge-cyan" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
            <UserCheck size={14} /> Candidate
          </span>
        );
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 1.5rem' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem'
          }}
        >
          <ArrowLeft size={16} /> Back to Overview
        </Link>
        <button
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Protected Session Status Card */}
      <div className="card card-glass" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '1.85rem' }}>Protected Workspace</h1>
              {getRoleBadge(user?.role)}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Session actively authenticated via secure <code style={{ color: 'var(--accent-cyan)' }}>HttpOnly</code> cookie.
            </p>
          </div>
          <div
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <CheckCircle2 size={16} /> Route Guard Active
          </div>
        </div>

        {/* User Identity Details Table */}
        <div
          style={{
            marginTop: '2rem',
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--glass-border)',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)', fontWeight: 600, fontSize: '0.9rem' }}>
            Authenticated Principal Details
          </div>
          <div style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                Full Name
              </span>
              <strong style={{ fontSize: '1rem' }}>{user?.name}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                Email Address
              </span>
              <strong style={{ fontSize: '1rem' }}>{user?.email}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                System Role
              </span>
              <strong style={{ fontSize: '1rem', textTransform: 'capitalize' }}>{user?.role}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                Account Status
              </span>
              <span className="badge badge-success">
                {user?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Phase 4 & 5 Quick Navigation */}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            to="/jobs"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Briefcase size={15} /> Browse Jobs
          </Link>
          {user?.role === 'candidate' && (
            <Link
              to="/applications"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <span>My Applications</span>
            </Link>
          )}
          {(user?.role === 'recruiter' || user?.role === 'admin') && (
            <>
              <Link
                to="/recruiter/company"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <span>Company Profile</span>
              </Link>
              <Link
                to="/recruiter/jobs"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <span>My Job Listings</span>
              </Link>
              <Link
                to="/recruiter/jobs/new"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <span>+ Post New Job</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Live Role-Based Access Control (RBAC) Tester */}
      <div className="card card-glass" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <KeyRound size={20} color="var(--primary-400)" />
          <h2 style={{ fontSize: '1.35rem' }}>Live RBAC Authorization Verification</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Test the backend authorization middleware directly. Endpoints are restricted by role.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => testRbacEndpoint('recruiter')}
            disabled={testingEndpoint !== ''}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Lock size={15} />
            <span>Test Endpoint: Recruiter/Admin Only</span>
          </button>

          <button
            onClick={() => testRbacEndpoint('admin')}
            disabled={testingEndpoint !== ''}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ShieldCheck size={15} />
            <span>Test Endpoint: Admin Only</span>
          </button>
        </div>

        {/* Live Test Result Callout */}
        {testResult && (
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: testResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
              border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
              color: testResult.success ? '#34d399' : '#fda4af',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            {testResult.success ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            <div>
              <strong>HTTP {testResult.status} {testResult.success ? 'OK' : 'Forbidden'}:</strong> {testResult.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
