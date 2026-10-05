import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { dashboardApi } from '../services/api.js';
import {
  Briefcase,
  FileText,
  Sparkles,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Layers,
  Award,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export default function CandidateDashboardPage() {
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
        dashboardApi.getCandidateDashboard(),
        dashboardApi.getCandidateAnalytics().catch((e) => ({ data: null }))
      ]);
      setDashboard(dashRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
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

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1rem' }}>
      {/* Welcome & Header */}
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
            <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
              Candidate Dashboard
            </span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0] || 'Candidate'}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Track your job applications, resume analyses, and AI recommendations in one place.
          </p>
        </div>

        {/* Tab switch */}
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

      {/* Error Banner */}
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
        <div>
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
        </div>
      )}

      {/* Dashboard Body */}
      {!loading && !error && dashboard && (
        <>
          {activeTab === 'overview' && (
            <>
              {/* Top Summary Metric Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '2rem'
                }}
              >
                {/* 1. Applications */}
                <div className="card" style={{ padding: '1.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Applications
                    </span>
                    <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)' }}>
                      <Briefcase size={18} color="#3b82f6" />
                    </div>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {dashboard.applications.total}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{dashboard.applications.shortlisted} Shortlisted</span> •
                    <span>{dashboard.applications.interview} Interview</span> •
                    <span>{dashboard.applications.selected} Selected</span>
                  </div>
                </div>

                {/* 2. Resumes */}
                <div className="card" style={{ padding: '1.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Uploaded Resumes
                    </span>
                    <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)' }}>
                      <FileText size={18} color="#10b981" />
                    </div>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {dashboard.resumes.total}
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {dashboard.resumes.ready} Verified / Ready for ATS
                  </div>
                </div>

                {/* 3. AI Analyses */}
                <div className="card" style={{ padding: '1.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      AI Analyses
                    </span>
                    <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)' }}>
                      <Sparkles size={18} color="#a855f7" />
                    </div>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {dashboard.ai.total}
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {dashboard.ai.averageScore > 0
                      ? `Average compatibility: ${dashboard.ai.averageScore}%`
                      : 'No analyses performed yet'}
                  </div>
                </div>

                {/* 4. Match Opportunities */}
                <div className="card" style={{ padding: '1.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Matched Opportunities
                    </span>
                    <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)' }}>
                      <Zap size={18} color="#f59e0b" />
                    </div>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {dashboard.matches.totalRecommended}
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Highest match: {dashboard.matches.highestScore}%
                  </div>
                </div>
              </div>

              {/* Quick Actions Row */}
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
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(6, 182, 212, 0.04))'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Quick Actions
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Boost your application conversion rate with AI-powered features.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <Link to="/jobs" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                    <Briefcase size={14} /> Browse Jobs
                  </Link>
                  <Link to="/resumes" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                    <FileText size={14} /> Manage Resumes
                  </Link>
                  <Link to="/job-matches" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                    <Zap size={14} color="#a855f7" /> Job Matches
                  </Link>
                  <Link to="/resume-analysis" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                    <Sparkles size={14} /> AI Analyzer
                  </Link>
                </div>
              </div>

              {/* Two Column Layout: Recent Applications & Top Job Matches */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2rem'
                }}
              >
                {/* Recent Applications Card */}
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
                      Recent Applications
                    </h3>
                    <Link
                      to="/applications"
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

                  {dashboard.applications.recent.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                      <Briefcase size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
                      <p style={{ fontSize: '0.9rem' }}>No job applications submitted yet.</p>
                      <Link to="/jobs" className="btn btn-secondary" style={{ fontSize: '0.8rem', marginTop: '0.75rem' }}>
                        Explore Open Roles
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {dashboard.applications.recent.map((app) => (
                        <Link
                          key={app._id}
                          to={`/applications/${app._id}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.85rem 1rem',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--glass-border)',
                            textDecoration: 'none',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.925rem' }}>
                              {app.job?.title || 'Job Posting'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              {app.job?.company?.name || 'Company'} • {app.job?.location || 'Location'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {getStatusBadge(app.status)}
                            <ChevronRight size={14} color="var(--text-muted)" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Job Matches Card */}
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
                      Top Recommended Matches
                    </h3>
                    <Link
                      to="/job-matches"
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

                  {dashboard.matches.topMatches.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                      <Zap size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
                      <p style={{ fontSize: '0.9rem' }}>No job match recommendations found yet.</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Upload a resume or update your profile skills to unlock recommendations.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {dashboard.matches.topMatches.map((m) => (
                        <Link
                          key={m.job._id}
                          to={`/jobs/${m.job._id}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.85rem 1rem',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--glass-border)',
                            textDecoration: 'none',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.925rem' }}>
                              {m.job.title}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              {m.job.company?.name} • {m.job.location} ({m.job.workMode})
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                background: 'rgba(124, 58, 237, 0.15)',
                                color: getScoreColor(m.matchScore),
                                border: `1px solid ${getScoreColor(m.matchScore)}`
                              }}
                            >
                              {m.matchScore}%
                            </div>
                            <ChevronRight size={14} color="var(--text-muted)" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Cards: Recent Resume & Recent AI Analysis */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '1.5rem'
                }}
              >
                {/* Recent Resume */}
                <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                    Primary Resume
                  </h4>
                  {dashboard.resumes.recent ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileText size={20} color="#10b981" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {dashboard.resumes.recent.originalFileName}
                          </div>
                          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                            Status: <span style={{ color: '#10b981', textTransform: 'capitalize' }}>{dashboard.resumes.recent.status}</span>
                            {dashboard.resumes.recent.isDefault && ' • Default Resume'}
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop: '1rem' }}>
                        <Link to="/resumes" className="btn btn-glass" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                          Manage Resumes
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No resume uploaded yet.{' '}
                      <Link to="/resumes" style={{ color: 'var(--primary-400)' }}>
                        Upload now
                      </Link>
                    </div>
                  )}
                </div>

                {/* Recent AI Analysis */}
                <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                    Latest AI Resume Analysis
                  </h4>
                  {dashboard.ai.recent ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {dashboard.ai.recent.job?.title || 'Target Job'}
                          </div>
                          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                            {dashboard.ai.recent.job?.company?.name || 'Company'}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            color: getScoreColor(dashboard.ai.recent.matchScore)
                          }}
                        >
                          {dashboard.ai.recent.matchScore}%
                        </div>
                      </div>
                      <div style={{ marginTop: '1rem' }}>
                        <Link
                          to={`/resume-analysis/${dashboard.ai.recent._id}`}
                          className="btn btn-glass"
                          style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                        >
                          View Full Breakdown
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No AI analysis performed yet.{' '}
                      <Link to="/resume-analysis" style={{ color: 'var(--primary-400)' }}>
                        Run your first analysis
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Analytics View Tab */}
          {activeTab === 'analytics' && analytics && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Application Status Distribution */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  Applications by Status
                </h3>
                {analytics.applicationsByStatus.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No applications to display.</p>
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
                              {item.count} ({percentage}%)
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
                                background: 'var(--grad-primary)',
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

              {/* Two Column: Activity Over Time & Score Distribution */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '1.5rem'
                }}
              >
                {/* Activity Over Time */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                    Application Activity
                  </h3>
                  {analytics.applicationsOverTime.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No activity over time yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {analytics.applicationsOverTime.map((p) => (
                        <div
                          key={p.period}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.02)'
                          }}
                        >
                          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{p.period}</span>
                          <span className="badge badge-primary">{p.count} applications</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score Distribution */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                    AI Match Score Distribution
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Excellent (85%+)</span>
                      <span style={{ fontWeight: 700, color: '#10b981' }}>
                        {analytics.scoreDistribution.excellent}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Strong (70–84%)</span>
                      <span style={{ fontWeight: 700, color: '#3b82f6' }}>
                        {analytics.scoreDistribution.strong}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Moderate (50–69%)</span>
                      <span style={{ fontWeight: 700, color: '#f59e0b' }}>
                        {analytics.scoreDistribution.moderate}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Low (Under 50%)</span>
                      <span style={{ fontWeight: 700, color: '#ef4444' }}>
                        {analytics.scoreDistribution.low}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: '1.25rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--glass-border)',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Average compatibility score:{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {analytics.scoreDistribution.average}%
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
