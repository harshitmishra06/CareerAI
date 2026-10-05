import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { jobApi } from '../services/api.js';
import {
  Search,
  MapPin,
  Briefcase,
  Building2,
  DollarSign,
  Clock,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export default function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 9, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state initialized from URL query params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [workMode, setWorkMode] = useState(searchParams.get('workMode') || '');
  const [employmentType, setEmploymentType] = useState(searchParams.get('employmentType') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 9,
        ...(searchTerm && { search: searchTerm }),
        ...(location && { location }),
        ...(workMode && { workMode }),
        ...(employmentType && { employmentType })
      };
      const response = await jobApi.getPublicJobs(params);
      setJobs(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err.message || 'Failed to fetch job postings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Update URL query parameters
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (location) params.location = location;
    if (workMode) params.workMode = workMode;
    if (employmentType) params.employmentType = employmentType;
    if (page > 1) params.page = page;
    setSearchParams(params, { replace: true });
  }, [page, workMode, employmentType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setLocation('');
    setWorkMode('');
    setEmploymentType('');
    setPage(1);
    setSearchParams({}, { replace: true });
  };

  const formatSalary = (min, max, currency) => {
    if (!min && !max) return 'Salary Undisclosed';
    const curr = currency || 'USD';
    const formatNum = (num) => (num >= 1000 ? `$${Math.round(num / 1000)}k` : `$${num}`);
    if (min && max) return `${formatNum(min)} - ${formatNum(max)} ${curr}`;
    if (min) return `From ${formatNum(min)} ${curr}`;
    return `Up to ${formatNum(max)} ${curr}`;
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', minHeight: '80vh' }}>
      {/* Page Header */}
      <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 2.5rem' }}>
        <span className="badge badge-cyan" style={{ marginBottom: '0.75rem' }}>
          Live Career Opportunities
        </span>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
          Explore Open <span className="text-gradient">Positions</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
          Discover verified roles from top tech teams. Filter by work mode, employment type, or key skills.
        </p>
      </div>

      {/* Search Bar & Filters Section */}
      <div className="card card-glass" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'center' }}>
            {/* Keyword Search */}
            <div style={{ position: 'relative' }}>
              <Search
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="Job title, skill, or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Location Input */}
            <div style={{ position: 'relative' }}>
              <MapPin
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="City, region, or country..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Search Button */}
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
              <Search size={16} />
              <span>Search Jobs</span>
            </button>
          </div>

          {/* Quick Filter Pills Row */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--glass-border)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <Filter size={15} /> Filters:
            </div>

            {/* Work Mode Select */}
            <select
              value={workMode}
              onChange={(e) => {
                setWorkMode(e.target.value);
                setPage(1);
              }}
              className="form-input"
              style={{ width: 'auto', padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
            >
              <option value="">Work Mode (All)</option>
              <option value="remote">Remote Only</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-Site</option>
            </select>

            {/* Employment Type Select */}
            <select
              value={employmentType}
              onChange={(e) => {
                setEmploymentType(e.target.value);
                setPage(1);
              }}
              className="form-input"
              style={{ width: 'auto', padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
            >
              <option value="">Employment Type (All)</option>
              <option value="full-time">Full-Time</option>
              <option value="part-time">Part-Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="freelance">Freelance</option>
            </select>

            {/* Clear Filters Button */}
            {(searchTerm || location || workMode || employmentType) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn btn-glass"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: 'var(--accent-rose)' }}
              >
                <X size={14} /> Clear Filters
              </button>
            )}

            <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Showing {jobs.length} of {meta.total} published jobs
            </div>
          </div>
        </form>
      </div>

      {/* Job Cards Grid / Loading / Empty State */}
      {loading ? (
        <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <Loader2 size={36} color="var(--primary-400)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Fetching live career opportunities...</span>
        </div>
      ) : error ? (
        <div className="card card-glass" style={{ padding: '2rem', textAlign: 'center', color: '#fda4af' }}>
          <p>{error}</p>
          <button onClick={fetchJobs} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
            Try Again
          </button>
        </div>
      ) : jobs.length === 0 ? (
        <div className="card card-glass" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <Briefcase size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>No Jobs Match Your Search</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            We could not find any published jobs matching your specified criteria. Try clearing your filters or searching for different keywords.
          </p>
          <button onClick={handleClearFilters} className="btn btn-primary">
            View All Open Jobs
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {jobs.map((job) => (
            <div key={job._id} className="card card-glass card-interactive" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
              {/* Header: Company & Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'rgba(124, 58, 237, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary-400)',
                      border: '1px solid rgba(124, 58, 237, 0.25)'
                    }}
                  >
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {job.company?.name || 'Partner Company'}
                      {job.company?.isVerified && (
                        <CheckCircle2 size={14} color="var(--accent-emerald)" title="Verified Company" />
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{job.company?.industry || 'Tech'}</div>
                  </div>
                </div>

                <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                  {job.workMode}
                </span>
              </div>

              {/* Job Title */}
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.65rem', lineHeight: 1.3 }}>
                <Link to={`/jobs/${job._id}`} style={{ color: 'var(--text-primary)' }}>
                  {job.title}
                </Link>
              </h2>

              {/* Meta Pill Info */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} /> {job.location}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Briefcase size={14} /> <span style={{ textTransform: 'capitalize' }}>{job.employmentType}</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-emerald)' }}>
                  <DollarSign size={14} /> {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                </span>
              </div>

              {/* Description preview */}
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  marginBottom: '1.25rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  flexGrow: 1
                }}
              >
                {job.description}
              </p>

              {/* Skills Tags */}
              {job.skills && job.skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
                  {job.skills.slice(0, 4).map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--glass-border)',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                  {job.skills.length > 4 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                      +{job.skills.length - 4} more
                    </span>
                  )}
                </div>
              )}

              {/* Card Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--glass-border)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={13} />
                  {job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : 'Recently posted'}
                </span>
                <Link
                  to={`/jobs/${job._id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 600,
                    color: 'var(--primary-400)'
                  }}
                >
                  View Details <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {meta.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '3rem' }}>
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 0.85rem' }}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Page <strong>{meta.page}</strong> of <strong>{meta.totalPages}</strong>
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(meta.totalPages, prev + 1))}
            disabled={page === meta.totalPages}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 0.85rem' }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
