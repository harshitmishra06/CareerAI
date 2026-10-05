import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  Search,
  RefreshCw,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Award
} from 'lucide-react';
import { jobMatchApi } from '../services/api.js';

export default function JobMatchesPage() {
  const [matches, setMatches] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [minScore, setMinScore] = useState(0);
  const [workMode, setWorkMode] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchMatches = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10
      };
      if (minScore > 0) params.minScore = minScore;
      if (workMode) params.workMode = workMode;
      if (search.trim()) params.search = search.trim();

      const response = await jobMatchApi.getMatches(params);
      setMatches(response.data?.matches || []);
      setPagination(response.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      setMeta(response.data?.meta || null);
    } catch (err) {
      setError(err.message || 'Failed to retrieve job recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches(currentPage);
  }, [currentPage, minScore, workMode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMatches(1);
  };

  const getScoreTheme = (score) => {
    if (score >= 80) {
      return {
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.35)',
        label: 'Strong Match'
      };
    }
    if (score >= 60) {
      return {
        color: '#06b6d4',
        bg: 'rgba(6, 182, 212, 0.12)',
        border: 'rgba(6, 182, 212, 0.35)',
        label: 'Good Alignment'
      };
    }
    if (score >= 40) {
      return {
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.35)',
        label: 'Moderate Alignment'
      };
    }
    return {
      color: '#f43f5e',
      bg: 'rgba(244, 63, 94, 0.12)',
      border: 'rgba(244, 63, 94, 0.35)',
      label: 'Growth Gap'
    };
  };

  const formatSalary = (min, max, currency = 'USD') => {
    if (!min && !max) return 'Competitive';
    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 });
    if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}`;
    if (min) return `From ${formatter.format(min)}`;
    return `Up to ${formatter.format(max)}`;
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem' }}>
      {/* Hero Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span
            className="badge badge-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.75rem',
              fontSize: '0.8rem'
            }}
          >
            <Zap size={13} color="#a855f7" /> Phase 8 Intelligent Matching
          </span>
          <span
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '20px',
              padding: '0.25rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
          >
            Deterministic Skill-Overlap Engine
          </span>
        </div>

        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          Personalized <span className="text-gradient">Job Recommendations</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '750px', lineHeight: 1.6 }}>
          Jobs dynamically ranked by compatibility with your profile skills, verified experience, and resume keywords.
        </p>

        {/* Candidate Profile Context Banner */}
        {meta && (
          <div
            style={{
              marginTop: '1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '1.25rem',
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid var(--glass-border)',
              borderRadius: '10px',
              padding: '0.65rem 1.25rem',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#f8fafc' }}>
              <UserCheck size={15} color="var(--primary-400)" />
              Candidate Profile Active
            </span>
            <span>•</span>
            <span>
              Tracked Skills: <strong style={{ color: '#f8fafc' }}>{meta.candidateSkillsCount}</strong>
            </span>
            <span>•</span>
            <span>
              Experience: <strong style={{ color: '#f8fafc' }}>{meta.experienceYears} Years</strong>
            </span>
            <span>•</span>
            <span>
              Open Positions Evaluated: <strong style={{ color: '#f8fafc' }}>{meta.totalEligibleJobs}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card card-glass"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.25rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Left: Min Score Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '0.25rem' }}>
            Min Match:
          </span>
          {[
            { label: 'All Jobs', val: 0 },
            { label: '50%+ Good', val: 50 },
            { label: '75%+ Strong', val: 75 }
          ].map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => {
                setMinScore(item.val);
                setCurrentPage(1);
              }}
              style={{
                background: minScore === item.val ? 'var(--primary-600)' : 'rgba(15, 23, 42, 0.6)',
                color: minScore === item.val ? '#ffffff' : 'var(--text-secondary)',
                border: minScore === item.val ? '1px solid var(--primary-500)' : '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '0.4rem 0.85rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Center / Right: Work Mode & Keyword Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            className="input"
            value={workMode}
            onChange={(e) => {
              setWorkMode(e.target.value);
              setCurrentPage(1);
            }}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', minWidth: '130px', background: '#090d16' }}
          >
            <option value="">All Work Modes</option>
            <option value="remote">Remote Only</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </select>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input"
                placeholder="Search job title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: '0.45rem 0.85rem 0.45rem 2rem', fontSize: '0.85rem', width: '180px' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}>
              Filter
            </button>
          </form>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          className="card card-glass"
          style={{
            borderColor: 'rgba(244, 63, 94, 0.35)',
            background: 'rgba(244, 63, 94, 0.08)',
            color: '#fca5a5',
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Matches List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--primary-400)' }} />
          <p style={{ fontSize: '1.05rem', fontWeight: 500 }}>Computing skill overlap and ranking job matches...</p>
        </div>
      ) : matches.length === 0 ? (
        <div
          className="card card-glass"
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            maxWidth: '600px',
            margin: '0 auto'
          }}
        >
          <Sparkles size={40} color="var(--primary-400)" style={{ margin: '0 auto 1rem', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>No Matching Jobs Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            {minScore > 0
              ? `No published jobs met your threshold of ${minScore}% match. Try lowering the minimum score filter.`
              : 'Add more skills or experience to your Candidate Profile to receive tailored job recommendations.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            {minScore > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setMinScore(0);
                  setWorkMode('');
                  setSearch('');
                  setCurrentPage(1);
                }}
              >
                Reset Filters
              </button>
            )}
            <Link to="/jobs" className="btn btn-primary">
              Browse All Jobs
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {matches.map((item) => {
            const { job, matchScore, matchedSkills, missingSkills, explanation } = item;
            const theme = getScoreTheme(matchScore);

            return (
              <div
                key={job._id}
                className="card card-glass"
                style={{
                  padding: '2rem',
                  border: `1px solid ${theme.border}`,
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Glow accent bar */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '5px',
                    height: '100%',
                    background: theme.color
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1.5rem',
                    marginBottom: '1.25rem'
                  }}
                >
                  {/* Left: Job Meta & Title */}
                  <div style={{ flex: '1 1 450px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.65rem' }}>
                      <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                        {job.workMode}
                      </span>
                      <span className="badge badge-cyan" style={{ textTransform: 'capitalize' }}>
                        {job.employmentType}
                      </span>
                      {job.experienceMin != null && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}>
                          {job.experienceMin}+ Years Exp
                        </span>
                      )}
                    </div>

                    <h2 style={{ fontSize: '1.45rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                      <Link
                        to={`/jobs/${job._id}`}
                        style={{ color: '#f8fafc', textDecoration: 'none' }}
                        onMouseEnter={(e) => (e.target.style.color = 'var(--primary-400)')}
                        onMouseLeave={(e) => (e.target.style.color = '#f8fafc')}
                      >
                        {job.title}
                      </Link>
                    </h2>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Building2 size={14} color="var(--primary-400)" />
                        <strong>{job.company?.name}</strong>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <MapPin size={14} color="var(--primary-400)" />
                        {job.location}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-emerald)' }}>
                        <DollarSign size={14} />
                        <strong>{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Right: Match Score Ring Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                    <div
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '50%',
                        background: theme.bg,
                        border: `2.5px solid ${theme.color}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 0 20px ${theme.color}22`
                      }}
                    >
                      <span style={{ fontSize: '1.45rem', fontWeight: 800, color: theme.color, lineHeight: 1 }}>
                        {matchScore}%
                      </span>
                      <span style={{ fontSize: '0.65rem', color: theme.color, fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>
                        {theme.label.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explanation Card */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.45)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    fontSize: '0.875rem',
                    color: '#cbd5e1',
                    marginBottom: '1.25rem',
                    lineHeight: 1.5
                  }}
                >
                  <strong style={{ color: '#f8fafc' }}>Compatibility Note:</strong> {explanation}
                </div>

                {/* Skill Overlap Breakdown (Matched vs Missing) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  {/* Matched */}
                  <div>
                    <div style={{ fontSize: '0.775rem', fontWeight: 600, color: '#34d399', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckCircle2 size={13} /> Matched Skills ({matchedSkills.length})
                    </div>
                    {matchedSkills.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {matchedSkills.map((s, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#a7f3d0',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              borderRadius: '6px',
                              padding: '0.2rem 0.55rem',
                              fontSize: '0.775rem',
                              fontWeight: 500,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <Check size={11} /> {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None detected</span>
                    )}
                  </div>

                  {/* Missing */}
                  <div>
                    <div style={{ fontSize: '0.775rem', fontWeight: 600, color: '#fb7185', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <AlertTriangle size={13} /> Skill Gaps ({missingSkills.length})
                    </div>
                    {missingSkills.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {missingSkills.map((s, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: 'rgba(244, 63, 94, 0.1)',
                              color: '#fecdd3',
                              border: '1px solid rgba(244, 63, 94, 0.25)',
                              borderRadius: '6px',
                              padding: '0.2rem 0.55rem',
                              fontSize: '0.775rem',
                              fontWeight: 500
                            }}
                          >
                            + {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#10b981' }}>✨ All skills satisfied!</span>
                    )}
                  </div>
                </div>

                {/* Bottom CTA Row */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    borderTop: '1px solid var(--glass-border)',
                    paddingTop: '1.25rem'
                  }}
                >
                  <Link
                    to={`/resume-analysis?jobId=${job._id}`}
                    style={{
                      fontSize: '0.85rem',
                      color: '#c4b5fd',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      textDecoration: 'none'
                    }}
                  >
                    <Sparkles size={14} color="#a855f7" /> Run Deep AI Analysis
                  </Link>

                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <Link
                      to={`/jobs/${job._id}`}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/jobs/${job._id}/apply`}
                      className="btn btn-primary"
                      style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      Apply Now <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.75rem',
                marginTop: '1.5rem'
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!pagination.hasPrevPage}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <ChevronLeft size={15} /> Prev
              </button>

              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} matches)
              </span>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={!pagination.hasNextPage}
                onClick={() => setCurrentPage((p) => p + 1)}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
