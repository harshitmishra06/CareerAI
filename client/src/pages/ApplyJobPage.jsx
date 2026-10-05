import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobApi, applicationApi, resumeApi } from '../services/api.js';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Info,
  Star,
  Plus
} from 'lucide-react';

export default function ApplyJobPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [jobError, setJobError] = useState(null);

  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [loadingResumes, setLoadingResumes] = useState(true);

  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoadingJob(true);
        setJobError(null);
        const response = await jobApi.getPublicJobById(id);
        setJob(response.data);
      } catch (err) {
        setJobError(err.message || 'Failed to load job details');
      } finally {
        setLoadingJob(false);
      }
    };

    const fetchCandidateResumes = async () => {
      try {
        setLoadingResumes(true);
        const res = await resumeApi.getMyResumes();
        const list = res.data || [];
        setResumes(list);
        const def = list.find((r) => r.isDefault);
        if (def) {
          setSelectedResumeId(def._id);
        } else if (list.length > 0) {
          setSelectedResumeId(list[0]._id);
        }
      } catch {
        // Fallback silently if not candidate or resumes failed
      } finally {
        setLoadingResumes(false);
      }
    };

    fetchJob();
    fetchCandidateResumes();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const response = await applicationApi.apply({
        jobId: id,
        coverLetter: coverLetter.trim(),
        resumeId: selectedResumeId || undefined
      });
      setSubmitSuccess(response.data);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const formatSalary = (min, max, currency) => {
    if (!min && !max) return 'Compensation undisclosed';
    const curr = currency || 'USD';
    const fmt = (num) =>
      num >= 1000 ? `${(num / 1000).toFixed(0)}k` : num.toLocaleString();
    if (min && max) return `${curr} ${fmt(min)} - ${fmt(max)}`;
    return `${curr} ${fmt(min || max)}`;
  };

  if (loadingJob) {
    return (
      <div className="container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <Loader2 size={36} color="var(--primary-400)" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading application portal...</span>
      </div>
    );
  }

  if (jobError || !job) {
    return (
      <div className="container" style={{ maxWidth: '650px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="card card-glass" style={{ padding: '3rem' }}>
          <AlertCircle size={44} color="var(--accent-rose)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Unable to Open Application</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {jobError || 'Job posting not found.'}
          </p>
          <Link to="/jobs" className="btn btn-secondary">
            <ArrowLeft size={16} /> Return to Job Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '2.5rem auto', padding: '0 1rem' }}>
      {/* Back Link */}
      <Link
        to={`/jobs/${id}`}
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
        <ArrowLeft size={16} /> Back to Job Details
      </Link>

      {/* Success Confirmation State */}
      {submitSuccess ? (
        <div className="card card-glass" style={{ padding: '3.5rem 2.5rem', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: 'var(--accent-emerald)'
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.75rem' }}>Application Submitted!</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
            Your application for <strong style={{ color: 'var(--text-primary)' }}>{job.title}</strong> at{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{job.company?.name}</strong> has been successfully delivered to the hiring team.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/applications" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
              View My Applications
            </Link>
            <Link to={`/applications/${submitSuccess._id}`} className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
              View Application Details
            </Link>
            <Link to="/jobs" className="btn btn-glass" style={{ padding: '0.75rem 1.5rem' }}>
              Browse More Jobs
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Header Card */}
          <div className="card card-glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-primary">Job Application</span>
              <span className="badge badge-cyan" style={{ textTransform: 'capitalize' }}>{job.employmentType}</span>
            </div>

            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{job.title}</h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building2 size={16} color="var(--primary-400)" />
                <strong>{job.company?.name}</strong>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={16} color="var(--primary-400)" />
                {job.location} ({job.workMode})
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-emerald)' }}>
                <DollarSign size={16} />
                <strong>{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</strong>
              </span>
            </div>
          </div>

          {/* Phase 6 Resume Attachment Selector */}
          <div className="card card-glass" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FileText size={20} color="var(--primary-400)" />
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Attach Resume</h2>
              </div>
              <Link
                to="/resumes"
                style={{ fontSize: '0.85rem', color: '#818cf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Plus size={14} /> Manage Resumes
              </Link>
            </div>

            {loadingResumes ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                <Loader2 size={16} className="animate-spin" /> Loading your resumes...
              </div>
            ) : resumes.length === 0 ? (
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.4)',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  textAlign: 'center'
                }}
              >
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#cbd5e1' }}>
                  You have not uploaded any resumes yet.
                </p>
                <Link to="/resumes" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                  Upload a PDF Resume
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {resumes.map((resume) => (
                  <label
                    key={resume._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      background: selectedResumeId === resume._id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.4)',
                      border: selectedResumeId === resume._id ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input
                      type="radio"
                      name="resumeSelection"
                      value={resume._id}
                      checked={selectedResumeId === resume._id}
                      onChange={() => setSelectedResumeId(resume._id)}
                      style={{ accentColor: '#818cf8' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.925rem' }}>
                          {resume.originalFileName}
                        </span>
                        {resume.isDefault && (
                          <span
                            style={{
                              background: 'rgba(99, 102, 241, 0.2)',
                              color: '#a5b4fc',
                              borderRadius: '12px',
                              padding: '0.1rem 0.5rem',
                              fontSize: '0.725rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}
                          >
                            <Star size={10} fill="#a5b4fc" /> Default
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {(resume.fileSize / 1024).toFixed(0)} KB • Ready to attach
                      </span>
                    </div>
                  </label>
                ))}

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    background: selectedResumeId === '' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(15, 23, 42, 0.2)',
                    border: selectedResumeId === '' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(255, 255, 255, 0.04)',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="resumeSelection"
                    value=""
                    checked={selectedResumeId === ''}
                    onChange={() => setSelectedResumeId('')}
                    style={{ accentColor: '#818cf8' }}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                    Apply without attaching a resume file (profile details only)
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {submitError && (
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
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Application Error:</strong> {submitError}
                {submitError.includes('already submitted') && (
                  <div style={{ marginTop: '0.4rem' }}>
                    <Link to="/applications" style={{ color: '#ffffff', textDecoration: 'underline', fontWeight: 600 }}>
                      Go to My Applications to track its status
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Application Form */}
          <form onSubmit={handleSubmit} className="card card-glass" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <FileText size={20} color="var(--primary-400)" />
              <h2 style={{ fontSize: '1.25rem' }}>Candidate Cover Letter</h2>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Introduce yourself, highlight your top relevant achievements, and explain why you're a great fit for this position.
            </p>

            <div style={{ marginBottom: '1.75rem' }}>
              <label
                htmlFor="coverLetter"
                style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}
              >
                Cover Letter (Optional, max 4,000 characters)
              </label>
              <textarea
                id="coverLetter"
                rows={8}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                maxLength={4000}
                placeholder="Dear Hiring Team,&#10;&#10;I am excited to apply for this role. With my background in..."
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.925rem',
                  lineHeight: 1.6,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {coverLetter.length} / 4000 characters
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
              <Link to={`/jobs/${id}`} className="btn btn-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '170px', justifyContent: 'center' }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Submit Application</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
