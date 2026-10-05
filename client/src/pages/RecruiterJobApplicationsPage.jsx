import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { applicationApi, resumeApi } from '../services/api.js';
import {
  ArrowLeft,
  Users,
  Briefcase,
  MapPin,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  User,
  ExternalLink,
  GraduationCap,
  Download
} from 'lucide-react';

export default function RecruiterJobApplicationsPage() {
  const { id: jobId } = useParams();

  const [jobInfo, setJobInfo] = useState(null);
  const [applications, setApplications] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status updating state
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Modal / Drawer state for full applicant inspection
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [downloadingResume, setDownloadingResume] = useState(false);

  const handleDownloadResume = async (resume) => {
    if (!resume?._id) return;
    try {
      setDownloadingResume(true);
      const blob = await resumeApi.downloadFile(resume._id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', resume.originalFileName || 'applicant_resume.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Failed to download resume file');
    } finally {
      setDownloadingResume(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 10,
        ...(statusFilter ? { status: statusFilter } : {})
      };
      const response = await applicationApi.getJobApplications(jobId, params);
      setApplications(response.data || []);
      setJobInfo(response.job || null);
      setMeta(response.meta || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load applicants for this job');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [jobId, page, statusFilter]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      setUpdatingId(appId);
      setActionError(null);
      await applicationApi.updateStatus(appId, newStatus);
      // Refresh list
      await fetchApplications();
      // If modal open, update it
      if (selectedApplicant && selectedApplicant._id === appId) {
        setSelectedApplicant((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      setActionError(err.message || 'Failed to update application status');
    } finally {
      setUpdatingId(null);
    }
  };

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
            <Clock size={13} /> Interview
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
            <HelpCircle size={13} /> Screening
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
            <XCircle size={13} /> Rejected
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
    { label: 'All Applicants', val: '' },
    { label: 'Applied', val: 'applied' },
    { label: 'Screening', val: 'screening' },
    { label: 'Shortlisted', val: 'shortlisted' },
    { label: 'Interview', val: 'interview' },
    { label: 'Selected', val: 'selected' },
    { label: 'Rejected', val: 'rejected' },
    { label: 'Withdrawn', val: 'withdrawn' }
  ];

  return (
    <div className="container" style={{ maxWidth: '1050px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
      {/* Back Link */}
      <Link
        to="/recruiter/jobs"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          marginBottom: '1.75rem',
          textDecoration: 'none'
        }}
      >
        <ArrowLeft size={16} /> Back to Job Listings
      </Link>

      {/* Header Info */}
      <div className="card card-glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="badge badge-primary">Applicant Tracking</span>
              <span className="badge badge-cyan" style={{ textTransform: 'capitalize' }}>
                Job Status: {jobInfo?.status || 'Active'}
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>
              {jobInfo?.title || 'Applicant Review Board'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              Company: <strong style={{ color: 'var(--text-primary)' }}>{jobInfo?.company?.name || 'Your Company'}</strong> • Total Applicants: <strong style={{ color: 'var(--accent-cyan)' }}>{meta.total}</strong>
            </p>
          </div>

          <Link
            to={`/recruiter/jobs/${jobId}/edit`}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            Edit Job
          </Link>
        </div>
      </div>

      {/* Action / Error Banners */}
      {actionError && (
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
          <span>{actionError}</span>
        </div>
      )}

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
              color: statusFilter === tab.val ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applicant Cards / Table */}
      {loading ? (
        <div style={{ minHeight: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <Loader2 size={36} color="var(--primary-400)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Loading applicants...</span>
        </div>
      ) : applications.length === 0 ? (
        <div className="card card-glass" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <Users size={44} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>No Applicants in this View</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '440px', margin: '0 auto' }}>
            {statusFilter
              ? `No applicants currently match the status '${statusFilter}'.`
              : 'No candidates have applied to this position yet. Once applicants submit their cover letter, they will appear here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {applications.map((app) => {
            const cand = app.candidate;
            const candUser = cand?.user;
            return (
              <div
                key={app._id}
                className="card card-glass"
                style={{ padding: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}
              >
                {/* Left: Candidate Information */}
                <div style={{ minWidth: '280px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                      {candUser?.name || 'Candidate'}
                    </h3>
                    {app.resume && (
                      <span
                        style={{
                          fontSize: '0.725rem',
                          color: '#a5b4fc',
                          background: 'rgba(99, 102, 241, 0.15)',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <FileText size={11} /> PDF Resume
                      </span>
                    )}
                    {getStatusBadge(app.status)}
                  </div>

                  <p style={{ color: 'var(--primary-400)', fontSize: '0.9rem', fontWeight: 500, margin: '0 0 0.5rem' }}>
                    {cand?.headline || 'Candidate Applicant'}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Mail size={14} color="var(--text-muted)" />
                      {candUser?.email}
                    </span>
                    {cand?.location && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <MapPin size={14} color="var(--text-muted)" />
                        {cand.location}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={14} color="var(--text-muted)" />
                      Applied {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Skills tags */}
                  {cand?.skills && cand.skills.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {cand.skills.slice(0, 6).map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--glass-border)',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                      {cand.skills.length > 6 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                          +{cand.skills.length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Status Change Dropdown + View Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', alignItems: 'flex-end', minWidth: '190px' }}>
                  {/* Status Dropdown */}
                  {app.status === 'withdrawn' ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Withdrawn by Candidate
                    </span>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <label htmlFor={`status-${app._id}`} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Status:
                      </label>
                      <select
                        id={`status-${app._id}`}
                        value={app.status}
                        disabled={updatingId === app._id}
                        onChange={(e) => handleStatusChange(app._id, e.target.value)}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid var(--glass-border)',
                          color: 'var(--text-primary)',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="applied">Applied</option>
                        <option value="screening">Screening</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="interview">Interview</option>
                        <option value="selected">Selected</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      {updatingId === app._id && (
                        <Loader2 size={14} color="var(--primary-400)" style={{ animation: 'spin 1s linear infinite' }} />
                      )}
                    </div>
                  )}

                  {/* View Details Button */}
                  <button
                    onClick={() => setSelectedApplicant(app)}
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', padding: '0.45rem 0.85rem' }}
                  >
                    <Eye size={14} /> Review Application
                  </button>
                </div>
              </div>
            );
          })}
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
            Page {meta.page} of {meta.totalPages} ({meta.total} applicants)
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

      {/* Applicant Full Inspection Modal */}
      {selectedApplicant && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem'
          }}
        >
          <div
            className="card card-glass"
            style={{
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2.5rem',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
                    {selectedApplicant.candidate?.user?.name || 'Applicant Details'}
                  </h2>
                  {getStatusBadge(selectedApplicant.status)}
                </div>
                <p style={{ color: 'var(--primary-400)', fontSize: '0.9rem', margin: '0 0 0.5rem' }}>
                  {selectedApplicant.candidate?.headline || 'Candidate'}
                </p>
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Mail size={14} /> {selectedApplicant.candidate?.user?.email}
                  </span>
                  {selectedApplicant.candidate?.location && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={14} /> {selectedApplicant.candidate.location}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedApplicant(null)}
                className="btn btn-glass"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.9rem' }}
              >
                ✕ Close
              </button>
            </div>

            {/* Quick Status Bar */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--glass-border)',
                marginBottom: '1.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Application Stage:
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  value={selectedApplicant.status}
                  disabled={selectedApplicant.status === 'withdrawn' || updatingId === selectedApplicant._id}
                  onChange={(e) => handleStatusChange(selectedApplicant._id, e.target.value)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(9, 13, 22, 0.9)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="applied">Applied</option>
                  <option value="screening">Screening</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview">Interview</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                </select>
                {updatingId === selectedApplicant._id && (
                  <Loader2 size={15} color="var(--primary-400)" style={{ animation: 'spin 1s linear infinite' }} />
                )}
              </div>
            </div>

            {/* Attached Resume Section */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
                <FileText size={17} color="var(--primary-400)" />
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Attached Resume</h3>
              </div>
              {selectedApplicant.resume ? (
                <div
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div>
                    <strong style={{ color: '#f8fafc', fontSize: '0.9rem', display: 'block' }}>
                      {selectedApplicant.resume.originalFileName}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {(selectedApplicant.resume.fileSize / 1024).toFixed(0)} KB • PDF Document
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownloadResume(selectedApplicant.resume)}
                    disabled={downloadingResume}
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                  >
                    {downloadingResume ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> Downloading...
                      </>
                    ) : (
                      <>
                        <Download size={13} /> Download Resume
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>
                  No resume file was attached by this candidate (profile details only).
                </p>
              )}
            </div>

            {/* Cover Letter Section */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
                <FileText size={17} color="var(--primary-400)" />
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Cover Letter</h3>
              </div>
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {selectedApplicant.coverLetter || 'No cover letter was submitted with this application.'}
              </div>
            </div>

            {/* Candidate Skills */}
            {selectedApplicant.candidate?.skills && selectedApplicant.candidate.skills.length > 0 && (
              <div style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.65rem' }}>Skills Matrix</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {selectedApplicant.candidate.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        fontSize: '0.8rem',
                        color: '#93c5fd'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Candidate Bio */}
            {selectedApplicant.candidate?.bio && (
              <div style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>Candidate Bio</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
                  {selectedApplicant.candidate.bio}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
