import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationApi } from '../services/api.js';
import {
  Briefcase,
  Building2,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye
} from 'lucide-react';

export default function CandidateApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 10,
        ...(statusFilter ? { status: statusFilter } : {})
      };
      const response = await applicationApi.getMyApplications(params);
      setApplications(response.data || []);
      setMeta(response.meta || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load your applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'selected':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle2 size={13} /> Selected
          </span>
        );
      case 'interview':
        return (
          <span
            className="badge"
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Clock size={13} /> Interview Scheduled
          </span>
        );
      case 'shortlisted':
        return (
          <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Briefcase size={13} /> Shortlisted
          </span>
        );
      case 'screening':
        return (
          <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <HelpCircle size={13} /> In Screening
          </span>
        );
      case 'rejected':
        return (
          <span
            className="badge"
            style={{
              background: 'rgba(244, 63, 94, 0.12)',
              color: '#fda4af',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <XCircle size={13} /> Not Selected
          </span>
        );
      case 'withdrawn':
        return (
          <span
            className="badge"
            style={{
              background: 'rgba(148, 163, 184, 0.15)',
              color: '#94a3b8',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            Withdrawn
          </span>
        );
      default:
        return (
          <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle2 size={13} /> Applied
          </span>
        );
    }
  };

  const statusTabs = [
    { label: 'All Applications', val: '' },
    { label: 'Applied', val: 'applied' },
    { label: 'Screening', val: 'screening' },
    { label: 'Shortlisted', val: 'shortlisted' },
    { label: 'Interview', val: 'interview' },
    { label: 'Selected', val: 'selected' },
    { label: 'Rejected', val: 'rejected' },
    { label: 'Withdrawn', val: 'withdrawn' }
  ];

  return (
    <div className="container" style={{ maxWidth: '1000px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>Candidate Portal</span>
          <h1 style={{ fontSize: '2rem' }}>My Job Applications</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Track your submissions, interview invitations, and status reviews across all roles.
          </p>
        </div>
        <Link to="/jobs" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Briefcase size={16} /> Browse More Jobs
        </Link>
      </div>

      {/* Error Callout */}
      {error && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fda4af',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--glass-border)',
          marginBottom: '2rem',
          paddingBottom: '0.5rem',
          overflowX: 'auto'
        }}
      >
        {statusTabs.map((tab) => (
          <button
            key={tab.val}
            onClick={() => {
              setStatusFilter(tab.val);
              setPage(1);
            }}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.825rem',
              whiteSpace: 'nowrap',
              background: statusFilter === tab.val ? 'var(--grad-primary)' : 'transparent',
              color: statusFilter === tab.val ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div style={{ minHeight: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <Loader2 size={36} color="var(--primary-400)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Loading your applications...</span>
        </div>
      ) : applications.length === 0 ? (
        <div className="card card-glass" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <Briefcase size={44} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>No Applications Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            {statusFilter
              ? `You do not have any applications currently in '${statusFilter}' status.`
              : 'You have not submitted any job applications yet.'}
          </p>
          <Link to="/jobs" className="btn btn-primary">
            Explore Open Roles
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {applications.map((app) => (
            <div
              key={app._id}
              className="card card-glass card-interactive"
              style={{ padding: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}
            >
              <div style={{ minWidth: '280px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  {getStatusBadge(app.status)}
                  <span className="badge badge-cyan" style={{ textTransform: 'capitalize' }}>
                    {app.job?.workMode || 'Remote'}
                  </span>
                  <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                    {app.job?.employmentType || 'Full-time'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>
                  <Link
                    to={`/applications/${app._id}`}
                    style={{ color: 'var(--text-primary)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.target.style.color = 'var(--accent-cyan)')}
                    onMouseLeave={(e) => (e.target.style.color = 'var(--text-primary)')}
                  >
                    {app.job?.title || 'Untitled Role'}
                  </Link>
                </h3>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Building2 size={15} color="var(--primary-400)" />
                    <strong>{app.job?.company?.name || 'Company'}</strong>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={15} color="var(--primary-400)" />
                    {app.job?.location || 'Undisclosed'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={15} />
                    Applied {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link
                  to={`/applications/${app._id}`}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                >
                  <Eye size={15} /> Track Application
                </Link>
                {app.job?._id && (
                  <Link
                    to={`/jobs/${app.job._id}`}
                    className="btn btn-glass"
                    style={{ padding: '0.5rem 0.75rem' }}
                    title="View Job Posting"
                  >
                    <ExternalLink size={15} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2.5rem' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.85rem' }}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Page {meta.page} of {meta.totalPages} ({meta.total} total)
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.85rem' }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
