import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { applicationApi, resumeApi } from '../services/api.js';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  Loader2,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Download,
  HardDrive,
  Sparkles
} from 'lucide-react';

export default function CandidateApplicationDetailsPage() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Withdrawal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await applicationApi.getApplicationById(id);
      setApplication(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const [downloadingResume, setDownloadingResume] = useState(false);

  const handleDownloadResume = async () => {
    if (!application?.resume?._id) return;
    try {
      setDownloadingResume(true);
      const blob = await resumeApi.downloadFile(application.resume._id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', application.resume.originalFileName || 'resume.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Failed to download resume');
    } finally {
      setDownloadingResume(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'selected':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle2 size={13} /> Selected / Offer Extended
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

  const pipelineStages = [
    { key: 'applied', label: 'Applied' },
    { key: 'screening', label: 'Screening' },
    { key: 'shortlisted', label: 'Shortlisted' },
    { key: 'interview', label: 'Interview' },
    { key: 'selected', label: 'Offer' }
  ];

  const getStageIndex = (status) => {
    const map = { applied: 0, screening: 1, shortlisted: 2, interview: 3, selected: 4 };
    return map[status] !== undefined ? map[status] : -1;
  };

  if (loading) {
    return (
      <div className="container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <Loader2 size={36} color="var(--primary-400)" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading application details...</span>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="container" style={{ maxWidth: '650px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="card card-glass" style={{ padding: '3rem' }}>
          <AlertCircle size={44} color="var(--accent-rose)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Application Unavailable</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {error || 'The requested application could not be found or you do not have permission to view it.'}
          </p>
          <Link to="/applications" className="btn btn-secondary">
            <ArrowLeft size={16} /> Return to Applications
          </Link>
        </div>
      </div>
    );
  }

  const isTerminal = ['selected', 'rejected', 'withdrawn'].includes(application.status);
  const currentStageIdx = getStageIndex(application.status);

  return (
    <div className="container" style={{ maxWidth: '920px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Link
          to="/applications"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            textDecoration: 'none'
          }}
        >
          <ArrowLeft size={16} /> Back to My Applications
        </Link>

        {application.job?._id && (
          <Link
            to={`/jobs/${application.job._id}`}
            className="btn btn-glass"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <span>View Job Post</span>
            <ExternalLink size={13} />
          </Link>
        )}
      </div>

      {/* Success banner if just withdrawn */}
      {withdrawSuccess && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <CheckCircle2 size={18} />
          <span>Your application has been successfully withdrawn.</span>
        </div>
      )}

      {/* Withdraw error banner */}
      {withdrawError && (
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
          <span>{withdrawError}</span>
        </div>
      )}

      {/* Header Overview Card */}
      <div className="card card-glass" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              {getStatusBadge(application.status)}
              <span className="badge badge-cyan" style={{ textTransform: 'capitalize' }}>
                {application.job?.workMode || 'Remote'}
              </span>
              <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                {application.job?.employmentType || 'Full-Time'}
              </span>
            </div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{application.job?.title}</h1>
            <p style={{ color: 'var(--accent-cyan)', fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
              {application.job?.company?.name}
            </p>
          </div>

          {!isTerminal && (
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="btn btn-secondary"
              style={{
                color: 'var(--accent-rose)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem'
              }}
            >
              <Trash2 size={15} /> Withdraw Application
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MapPin size={16} color="var(--primary-400)" />
            {application.job?.location || 'Undisclosed'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={16} color="var(--primary-400)" />
            Applied on {new Date(application.appliedAt || application.createdAt).toLocaleDateString()}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={16} color="var(--primary-400)" />
            Last updated {new Date(application.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Progress Timeline (if not rejected or withdrawn) */}
      {!['rejected', 'withdrawn'].includes(application.status) && (
        <div className="card card-glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.5rem' }}>Hiring Review Stages</h3>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
            {/* Horizontal line */}
            <div
              style={{
                position: 'absolute',
                top: '18px',
                left: '20px',
                right: '20px',
                height: '3px',
                background: 'rgba(255, 255, 255, 0.1)',
                zIndex: 0
              }}
            />

            {pipelineStages.map((stage, idx) => {
              const isPassed = currentStageIdx >= idx;
              const isCurrent = currentStageIdx === idx;
              return (
                <div
                  key={stage.key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: isCurrent
                        ? 'var(--grad-primary)'
                        : isPassed
                        ? 'var(--accent-emerald)'
                        : 'rgba(15, 23, 42, 0.9)',
                      border: isPassed ? 'none' : '2px solid rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: isCurrent ? '0 0 15px rgba(124, 58, 237, 0.6)' : 'none'
                    }}
                  >
                    {isPassed ? <CheckCircle2 size={18} /> : <span style={{ fontSize: '0.8rem' }}>{idx + 1}</span>}
                  </div>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? 'var(--text-primary)' : isPassed ? 'var(--accent-emerald)' : 'var(--text-muted)'
                    }}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Terminal Callout for Rejected/Withdrawn */}
      {application.status === 'withdrawn' && (
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(148, 163, 184, 0.08)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem'
          }}
        >
          <AlertCircle size={20} color="#94a3b8" />
          <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
            This application was withdrawn by you and is no longer being actively reviewed by the hiring team.
          </span>
        </div>
      )}

      {application.status === 'rejected' && (
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem'
          }}
        >
          <XCircle size={20} color="#fda4af" />
          <span style={{ color: '#fda4af', fontSize: '0.9rem' }}>
            The hiring team has decided to proceed with other candidates for this position. Thank you for your interest!
          </span>
        </div>
      )}

      {/* Attached Resume */}
      <div className="card card-glass" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <FileText size={20} color="var(--primary-400)" />
          <h2 style={{ fontSize: '1.25rem' }}>Attached Resume</h2>
        </div>

        {application.resume ? (
          <div
            style={{
              padding: '1.25rem 1.5rem',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <FileText size={22} />
              </div>
              <div>
                <strong style={{ color: '#f8fafc', fontSize: '0.95rem', display: 'block' }}>
                  {application.resume.originalFileName}
                </strong>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {(application.resume.fileSize / 1024).toFixed(0)} KB • Attached PDF
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleDownloadResume}
                disabled={downloadingResume}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}
              >
                {downloadingResume ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Downloading...
                  </>
                ) : (
                  <>
                    <Download size={14} /> Download Resume
                  </>
                )}
              </button>

              {application.job?._id && application.resume?._id && (
                <Link
                  to={`/resume-analysis?jobId=${application.job._id}&resumeId=${application.resume._id}`}
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontSize: '0.85rem',
                    background: 'rgba(124, 58, 237, 0.12)',
                    borderColor: 'rgba(124, 58, 237, 0.35)',
                    color: '#c4b5fd'
                  }}
                  title="Evaluate this resume against the job description"
                >
                  <Sparkles size={14} color="#a855f7" /> View AI Match
                </Link>
              )}
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
            No resume file was attached with this application (profile details only).
          </p>
        )}
      </div>

      {/* Submitted Cover Letter */}
      <div className="card card-glass" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <FileText size={20} color="var(--primary-400)" />
          <h2 style={{ fontSize: '1.25rem' }}>Submitted Cover Letter</h2>
        </div>

        {application.coverLetter ? (
          <div
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              fontSize: '0.925rem',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap'
            }}
          >
            {application.coverLetter}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
            No cover letter was included with this submission.
          </p>
        )}
      </div>

      {/* Withdrawal Confirmation Modal */}
      {showWithdrawModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
          }}
        >
          <div className="card card-glass" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(244, 63, 94, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-rose)'
                }}
              >
                <ShieldAlert size={20} />
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>Confirm Application Withdrawal</h3>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              Are you sure you want to withdraw your application for{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{application.job?.title}</strong>? Once withdrawn, the recruiter will no longer process your profile for this requisition.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowWithdrawModal(false)}
                disabled={withdrawing}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="btn btn-primary"
                style={{
                  background: 'var(--grad-rose, linear-gradient(135deg, #f43f5e 0%, #e11d48 100%))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                {withdrawing ? (
                  <>
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Withdrawing...</span>
                  </>
                ) : (
                  <span>Yes, Withdraw Application</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
