import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { jobApi } from '../services/api.js';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Globe,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
  Send,
  Users
} from 'lucide-react';

export default function JobDetailsPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await jobApi.getPublicJobById(id);
        setJob(response.data);
      } catch (err) {
        setError(err.message || 'Job posting not found or is no longer active.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id]);

  const formatSalary = (min, max, currency) => {
    if (!min && !max) return 'Salary Undisclosed';
    const curr = currency || 'USD';
    const formatNum = (num) => (num >= 1000 ? `$${Math.round(num / 1000)}k` : `$${num}`);
    if (min && max) return `${formatNum(min)} - ${formatNum(max)} ${curr}`;
    if (min) return `From ${formatNum(min)} ${curr}`;
    return `Up to ${formatNum(max)} ${curr}`;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <Loader2 size={36} color="var(--primary-400)" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading job details...</span>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="card card-glass" style={{ maxWidth: '520px', margin: '0 auto', padding: '3rem 2rem' }}>
          <AlertCircle size={44} color="var(--accent-rose)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Job Posting Unavailable</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>{error}</p>
          <Link to="/jobs" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Return to All Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem' }}>
      {/* Back button */}
      <Link
        to="/jobs"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          marginBottom: '2rem'
        }}
      >
        <ArrowLeft size={16} /> Back to Job Feed
      </Link>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '2.5rem', alignItems: 'start' }}>
        {/* Left Column: Job Details */}
        <div>
          {/* Hero Header Card */}
          <div className="card card-glass" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                {job.workMode}
              </span>
              <span className="badge badge-cyan" style={{ textTransform: 'capitalize' }}>
                {job.employmentType}
              </span>
              <span className="badge badge-success">
                <CheckCircle2 size={12} /> Accepting Applicants
              </span>
            </div>

            <h1 style={{ fontSize: '2.25rem', marginBottom: '1rem', lineHeight: 1.25 }}>{job.title}</h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building2 size={16} color="var(--primary-400)" />
                <strong>{job.company?.name}</strong>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={16} color="var(--primary-400)" />
                {job.location}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-emerald)' }}>
                <DollarSign size={16} />
                <strong>{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</strong>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} />
                Posted {job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : 'Recently'}
              </span>
            </div>

            {/* Quick Action Button in Header */}
            <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {job.status !== 'published' ? (
                <span className="badge badge-rose" style={{ padding: '0.5rem 1rem' }}>
                  Position Closed
                </span>
              ) : !isAuthenticated ? (
                <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.4rem' }}>
                  <Send size={15} /> Sign in to Apply
                </Link>
              ) : user?.role === 'candidate' ? (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <Link to={`/jobs/${job._id}/apply`} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.4rem' }}>
                    <Send size={16} /> Apply Now
                  </Link>
                  <Link
                    to={`/resume-analysis?jobId=${job._id}`}
                    className="btn btn-secondary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.65rem 1.25rem',
                      background: 'rgba(124, 58, 237, 0.15)',
                      border: '1px solid rgba(124, 58, 237, 0.35)',
                      color: '#c4b5fd'
                    }}
                  >
                    <Sparkles size={16} color="#a855f7" /> Analyze Match with AI
                  </Link>
                </div>
              ) : (
                <Link to={`/recruiter/jobs/${job._id}/applications`} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}>
                  <Users size={16} /> View Applicants
                </Link>
              )}
            </div>
          </div>

          {/* Job Overview & Specifications */}
          <div className="card card-glass" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.35rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
              Role Specifications
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                  Experience Required
                </span>
                <strong style={{ fontSize: '1rem' }}>
                  {job.experienceMin != null && job.experienceMax != null
                    ? `${job.experienceMin} - ${job.experienceMax} Years`
                    : job.experienceMin
                    ? `${job.experienceMin}+ Years`
                    : 'Not specified'}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                  Workplace Type
                </span>
                <strong style={{ fontSize: '1rem', textTransform: 'capitalize' }}>{job.workMode}</strong>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                  Employment Type
                </span>
                <strong style={{ fontSize: '1rem', textTransform: 'capitalize' }}>{job.employmentType}</strong>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                  Compensation
                </span>
                <strong style={{ fontSize: '1rem', color: 'var(--accent-emerald)' }}>
                  {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                </strong>
              </div>
            </div>

            {/* Required Skills */}
            {job.skills && job.skills.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Target Skill Competencies</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {job.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(124, 58, 237, 0.12)',
                        border: '1px solid rgba(124, 58, 237, 0.3)',
                        color: 'var(--primary-300)',
                        fontSize: '0.85rem',
                        fontWeight: 500
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description Body */}
            <div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Detailed Job Description</h4>
              <div
                style={{
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-line'
                }}
              >
                {job.description}
              </div>
            </div>
          </div>

          {/* Phase 7 AI Match Callout */}
          <div
            className="card card-glass"
            style={{
              padding: '1.75rem',
              borderLeft: '4px solid #a855f7',
              background: 'rgba(124, 58, 237, 0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <Sparkles size={28} color="#a855f7" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                AI Resume Match Analyzer Active (Phase 7)
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                Evaluate your resume against this job opening using Google Gemini AI to uncover matched competencies, skill gaps, and custom recommendations.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Application Action + Company Profile Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '90px' }}>
          {/* Action Card */}
          <div className="card card-glass" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Ready to Apply?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Submit your profile and tailored cover letter directly to the hiring team.
            </p>

            {job.status !== 'published' ? (
              <div className="badge badge-rose" style={{ padding: '0.55rem', display: 'block', textAlign: 'center', width: '100%' }}>
                Job Closed / Inactive
              </div>
            ) : !isAuthenticated ? (
              <Link
                to="/login"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.65rem' }}
              >
                Sign in to Apply
              </Link>
            ) : user?.role === 'candidate' ? (
              <>
                <Link
                  to={`/jobs/${job._id}/apply`}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', gap: '0.5rem', marginBottom: '0.75rem' }}
                >
                  <Send size={15} /> Apply Now
                </Link>
                <Link
                  to={`/resume-analysis?jobId=${job._id}`}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '0.65rem',
                    gap: '0.5rem',
                    background: 'rgba(124, 58, 237, 0.15)',
                    borderColor: 'rgba(124, 58, 237, 0.35)',
                    color: '#c4b5fd'
                  }}
                >
                  <Sparkles size={15} color="#a855f7" /> Analyze Match with AI
                </Link>
              </>
            ) : (
              <Link
                to={`/recruiter/jobs/${job._id}/applications`}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', gap: '0.5rem' }}
              >
                <Users size={15} /> View Applicants
              </Link>
            )}
          </div>

          <div className="card card-glass" style={{ padding: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'var(--grad-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  margin: '0 auto 1rem',
                  boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)'
                }}
              >
                <Building2 size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                {job.company?.name}
                {job.company?.isVerified && (
                  <CheckCircle2 size={16} color="var(--accent-emerald)" title="Verified Company" />
                )}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{job.company?.industry || 'Enterprise'}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', fontSize: '0.875rem' }}>
              {job.company?.location && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Location:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{job.company.location}</strong>
                </div>
              )}
              {job.company?.companySize && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Size:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{job.company.companySize} employees</strong>
                </div>
              )}
              {job.company?.foundedYear && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Founded:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{job.company.foundedYear}</strong>
                </div>
              )}
              {job.company?.website && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Website:</span>
                  <a
                    href={job.company.website.startsWith('http') ? job.company.website : `https://${job.company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-cyan)' }}
                  >
                    Visit <Globe size={13} />
                  </a>
                </div>
              )}
            </div>

            {job.company?.description && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                  About Company
                </span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {job.company.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
