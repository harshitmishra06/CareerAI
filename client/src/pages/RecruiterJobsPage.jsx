import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobApi, companyApi } from '../services/api.js';
import {
  Briefcase,
  PlusCircle,
  Edit3,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  MapPin,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Building2,
  Users
} from 'lucide-react';

export default function RecruiterJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasCompany, setHasCompany] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check company status
      try {
        await companyApi.getMine();
        setHasCompany(true);
      } catch (compErr) {
        if (compErr.statusCode === 404) {
          setHasCompany(false);
        }
      }

      const params = {
        page,
        limit: 10,
        ...(statusFilter && { status: statusFilter })
      };
      const response = await jobApi.getRecruiterJobs(params);
      setJobs(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err.message || 'Failed to retrieve jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, statusFilter]);

  const handleStatusChange = async (jobId, newStatus) => {
    setActionLoadingId(jobId);
    setFeedbackMsg('');
    setError(null);
    try {
      await jobApi.updateJobStatus(jobId, newStatus);
      setFeedbackMsg(`Job status updated to ${newStatus}`);
      fetchJobs();
    } catch (err) {
      setError(err.message || 'Failed to update job status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return (
          <span className="badge badge-success">
            <CheckCircle2 size={12} /> Published
          </span>
        );
      case 'closed':
        return (
          <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
            <XCircle size={12} /> Closed
          </span>
        );
      default:
        return (
          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <Clock size={12} /> Draft
          </span>
        );
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
            Recruiter Dashboard
          </span>
          <h1 style={{ fontSize: '2rem' }}>Job Posting Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Create, publish, edit, and track the lifecycle of your company's career openings.
          </p>
        </div>

        <Link
          to="/recruiter/jobs/new"
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <PlusCircle size={16} /> Create New Job
        </Link>
      </div>

      {/* Missing Company Alert */}
      {!hasCompany && (
        <div
          className="card card-glass"
          style={{
            padding: '1.5rem',
            marginBottom: '2rem',
            borderLeft: '4px solid var(--accent-amber)',
            background: 'rgba(245, 158, 11, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Building2 size={24} color="var(--accent-amber)" />
            <div>
              <strong>Company Profile Required:</strong> You must create your company profile before publishing jobs.
            </div>
          </div>
          <Link to="/recruiter/company" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            Setup Company Profile
          </Link>
        </div>
      )}

      {/* Notifications */}
      {feedbackMsg && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '0.9rem',
            marginBottom: '1.5rem'
          }}
        >
          {feedbackMsg}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fda4af',
            fontSize: '0.9rem',
            marginBottom: '1.5rem'
          }}
        >
          {error}
        </div>
      )}

      {/* Filter Status Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--glass-border)',
          marginBottom: '2rem',
          paddingBottom: '0.5rem'
        }}
      >
        {[
          { label: 'All Jobs', val: '' },
          { label: 'Published', val: 'published' },
          { label: 'Drafts', val: 'draft' },
          { label: 'Closed', val: 'closed' }
        ].map((tab) => (
          <button
            key={tab.val}
            onClick={() => {
              setStatusFilter(tab.val);
              setPage(1);
            }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              background: statusFilter === tab.val ? 'var(--grad-primary)' : 'transparent',
              color: statusFilter === tab.val ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Jobs List / Table */}
      {loading ? (
        <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <Loader2 size={36} color="var(--primary-400)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Loading your jobs...</span>
        </div>
      ) : jobs.length === 0 ? (
        <div className="card card-glass" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <Briefcase size={44} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>No Jobs in this View</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {statusFilter
              ? `You do not have any jobs with status '${statusFilter}'.`
              : 'You have not created any job postings yet.'}
          </p>
          <Link to="/recruiter/jobs/new" className="btn btn-primary">
            <PlusCircle size={16} /> Create Your First Job
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {jobs.map((job) => (
            <div
              key={job._id}
              className="card card-glass"
              style={{
                padding: '1.5rem 1.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1.25rem'
              }}
            >
              {/* Left Column: Job Info */}
              <div style={{ flex: '1 1 350px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                  <h3 style={{ fontSize: '1.2rem' }}>{job.title}</h3>
                  {getStatusBadge(job.status)}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={13} /> {job.location}
                  </span>
                  <span style={{ textTransform: 'capitalize' }}>
                    {job.workMode} • {job.employmentType}
                  </span>
                  {job.publishedAt && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={13} /> Published: {new Date(job.publishedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {/* Status Toggle Actions */}
                {job.status === 'draft' && (
                  <button
                    onClick={() => handleStatusChange(job._id, 'published')}
                    disabled={actionLoadingId === job._id}
                    className="btn btn-primary"
                    style={{ padding: '0.45rem 0.95rem', fontSize: '0.825rem' }}
                  >
                    {actionLoadingId === job._id ? 'Publishing...' : 'Publish'}
                  </button>
                )}

                {job.status === 'published' && (
                  <button
                    onClick={() => handleStatusChange(job._id, 'closed')}
                    disabled={actionLoadingId === job._id}
                    className="btn btn-secondary"
                    style={{ padding: '0.45rem 0.95rem', fontSize: '0.825rem', color: 'var(--accent-rose)' }}
                  >
                    {actionLoadingId === job._id ? 'Closing...' : 'Close Role'}
                  </button>
                )}

                {job.status === 'closed' && (
                  <button
                    onClick={() => handleStatusChange(job._id, 'published')}
                    disabled={actionLoadingId === job._id}
                    className="btn btn-secondary"
                    style={{ padding: '0.45rem 0.95rem', fontSize: '0.825rem' }}
                  >
                    {actionLoadingId === job._id ? 'Reopening...' : 'Re-Publish'}
                  </button>
                )}

                {/* View Applicants Button */}
                <Link
                  to={`/recruiter/jobs/${job._id}/applications`}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
                >
                  <Users size={14} /> Applicants
                </Link>

                {/* Edit Button */}
                <Link
                  to={`/recruiter/jobs/${job._id}/edit`}
                  className="btn btn-glass"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
                >
                  <Edit3 size={13} /> Edit
                </Link>

                {/* Public View link if published */}
                {job.status === 'published' && (
                  <Link
                    to={`/jobs/${job._id}`}
                    target="_blank"
                    className="btn btn-glass"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem', fontSize: '0.825rem', color: 'var(--accent-cyan)' }}
                    title="View candidate-facing posting"
                  >
                    <ExternalLink size={13} /> Live
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
            Page {meta.page} of {meta.totalPages}
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
