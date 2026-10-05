import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { dashboardApi } from '../services/api.js';
import {
  Building2,
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  PlusCircle,
  Settings,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function EmployerDashboardPage() {
  const { user } = useSelector((state) => state.auth);

  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'analytics'

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, analyticsRes] = await Promise.all([
        dashboardApi.getEmployerDashboard(),
        dashboardApi.getEmployerAnalytics().catch(() => ({ data: null }))
      ]);
      setDashboard(dashRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load employer dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <span className="badge badge-success">Published</span>;
      case 'draft':
        return <span className="badge badge-glass">Draft</span>;
      case 'closed':
        return <span className="badge badge-danger">Closed</span>;
      case 'selected':
        return <span className="badge badge-success">Selected</span>;
      case 'interview':
        return <span className="badge" style={{ background: '#3b82f6', color: '#ffffff' }}>Interview</span>;
      case 'shortlisted':
        return <span className="badge" style={{ background: '#8b5cf6', color: '#ffffff' }}>Shortlisted</span>;
      case 'screening':
        return <span className="badge" style={{ background: '#06b6d4', color: '#ffffff' }}>Screening</span>;
      case 'applied':
        return <span className="badge badge-primary">Applied</span>;
      case 'rejected':
        return <span className="badge badge-danger">Rejected</span>;
      case 'withdrawn':
        return <span className="badge badge-warning">Withdrawn</span>;
      default:
        return <span className="badge badge-glass">{status}</span>;
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
              Employer Portal
            </span>
            {dashboard?.company?.details && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {dashboard.company.details.name}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Hiring Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Manage your open postings, track candidates, and streamline your recruitment pipeline.
          </p>
        </div>

        {/* Tab Controls & Refresh */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-glass'}`}
            style={{ fontSize: '0.875rem' }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-glass'}`}
            style={{ fontSize: '0.875rem' }}
          >
            <TrendingUp size={15} style={{ marginRight: '0.35rem' }} /> Analytics
          </button>
          <button
            onClick={loadData}
            className="btn btn-glass"
            style={{ padding: '0.5rem' }}
            title="Refresh Data"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div
          className="card"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '1rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>{error}</span>
          <button onClick={loadData} className="btn btn-glass" style={{ fontSize: '0.8rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem'
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="card"
              style={{
                height: '110px',
                background: 'rgba(255, 255, 255, 0.02)',
                animation: 'pulse 1.5s infinite ease-in-out'
              }}
            />
          ))}
        </div>
      )}

      {/* Dashboard Body */}
      {!loading && !error && dashboard && (
        <>
          {activeTab === 'overview' && (
            <>
              {/* Metric Cards Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '2rem'
                }}
              >
                {/* 1. Total Jobs */}
                <div className="card" style={{ padding: '1.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Total Jobs Posted
                    </span>
                    <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.15)' }}>
                      <Briefcase size={18} color="#a855f7" />
                    </div>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {dashboard.jobs.total}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{dashboard.jobs.published} Published</span> •
                    <span>{dashboard.jobs.draft} Drafts</span> •
                    <span>{dashboard.jobs.closed} Closed</span>
                  </div>
                </div>

                {/* 2. Total Applications */}
                <div className="card" style={{ padding: '1.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Total Applicants
                    </span>
                    <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)' }}>
                      <Users size={18} color="#3b82f6" />
                    </div>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {dashboard.applications.total}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{dashboard.applications.shortlisted} Shortlisted</span> •
                    <span>{dashboard.applications.interview} Interview</span> •
                    <span>{dashboard.applications.selected} Selected</span>
                  </div>
                </div>

                {/* 3. Published Active Roles */}
                <div className="card" style={{ padding: '1.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Active Openings
                    </span>
                    <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)' }}>
                      <CheckCircle2 size={18} color="#10b981" />
                    </div>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>
                    {dashboard.jobs.published}
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Accepting candidate applications
                  </div>
                </div>

                {/* 4. Company Profile */}
                <div className="card" style={{ padding: '1.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Company Status
                    </span>
                    <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)' }}>
                      <Building2 size={18} color="#06b6d4" />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {dashboard.company.details?.name || 'Unregistered'}
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {dashboard.company.managedCount > 0 ? (
                      <span style={{ color: '#10b981' }}>Profile Active ({dashboard.company.details?.companySize || 'Size N/A'})</span>
                    ) : (
                      <Link to="/recruiter/company" style={{ color: 'var(--primary-400)' }}>
                        Setup Company Profile →
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div
                className="card"
                style={{
                  padding: '1.25rem 1.5rem',
                  marginBottom: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.04))'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Employer Actions
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Quick access to common recruitment workflows.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <Link to="/recruiter/jobs/new" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                    <PlusCircle size={15} /> Create Job
                  </Link>
                  <Link to="/recruiter/jobs" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                    <Briefcase size={15} /> Manage Jobs
                  </Link>
                  <Link to="/recruiter/company" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                    <Settings size={15} /> Manage Company
                  </Link>
                </div>
              </div>

              {/* Two Column Section: Recent Postings & Recent Applications */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: '1.5rem'
                }}
              >
                {/* Recent Jobs */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1.25rem'
                    }}
                  >
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Recent Job Postings
                    </h3>
                    <Link
                      to="/recruiter/jobs"
                      style={{
                        fontSize: '0.825rem',
                        color: 'var(--primary-400)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      View all <ChevronRight size={14} />
                    </Link>
                  </div>

                  {dashboard.jobs.recent.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                      <Briefcase size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
                      <p style={{ fontSize: '0.9rem' }}>No jobs posted yet.</p>
                      <Link to="/recruiter/jobs/new" className="btn btn-secondary" style={{ fontSize: '0.8rem', marginTop: '0.75rem' }}>
                        Post Your First Job
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {dashboard.jobs.recent.map((job) => (
                        <div
                          key={job._id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.85rem 1rem',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--glass-border)'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.925rem' }}>
                              {job.title}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              {job.location} • {job.workMode}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {getStatusBadge(job.status)}
                            <Link
                              to={`/recruiter/jobs/${job._id}/applications`}
                              className="btn btn-glass"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              title="View applicants"
                            >
                              Applicants
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Applications Received */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1.25rem'
                    }}
                  >
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Recent Applicants
                    </h3>
                  </div>

                  {dashboard.applications.recent.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                      <Users size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
                      <p style={{ fontSize: '0.9rem' }}>No candidate applications received yet.</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Once candidates apply to your published jobs, they will appear here.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {dashboard.applications.recent.map((app) => (
                        <div
                          key={app._id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.85rem 1rem',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--glass-border)'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.925rem' }}>
                              {app.candidate?.user?.name || 'Applicant'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              Applied for: <span style={{ color: 'var(--text-secondary)' }}>{app.job?.title || 'Job'}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {getStatusBadge(app.status)}
                            <Link
                              to={`/recruiter/jobs/${app.job?._id}/applications`}
                              className="btn btn-glass"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            >
                              Review
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Analytics View Tab */}
          {activeTab === 'analytics' && analytics && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Application Status Pipeline */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  Candidate Pipeline Distribution
                </h3>
                {analytics.applicationsByStatus.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No applications in pipeline.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {analytics.applicationsByStatus.map((item) => {
                      const percentage =
                        analytics.totalApplications > 0
                          ? Math.round((item.count / analytics.totalApplications) * 100)
                          : 0;

                      return (
                        <div key={item.status}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.85rem',
                              marginBottom: '0.35rem'
                            }}
                          >
                            <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{item.status}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>
                              {item.count} candidates ({percentage}%)
                            </span>
                          </div>
                          <div
                            style={{
                              height: '8px',
                              borderRadius: '4px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              overflow: 'hidden'
                            }}
                          >
                            <div
                              style={{
                                width: `${percentage}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                                borderRadius: '4px'
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Two Column: Top Jobs & Activity Over Time */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '1.5rem'
                }}
              >
                {/* Top Jobs by Applications */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                    Top Jobs by Applicants
                  </h3>
                  {analytics.topJobsByApplications.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No job applications to display.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {analytics.topJobsByApplications.map((j) => (
                        <div
                          key={j.jobId}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.02)'
                          }}
                        >
                          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{j.title}</span>
                          <span className="badge badge-primary">{j.applicationCount} applicants</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Applications Over Time */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                    Recruitment Velocity
                  </h3>
                  {analytics.applicationsOverTime.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No timeline data yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {analytics.applicationsOverTime.map((p) => (
                        <div
                          key={p.period}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.02)'
                          }}
                        >
                          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{p.period}</span>
                          <span className="badge badge-success">{p.count} applications</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
