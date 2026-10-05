import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Briefcase,
  Building2,
  TrendingUp,
  ArrowRight,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  Copy,
  Lightbulb,
  Award
} from 'lucide-react';
import { resumeAnalysisApi, resumeApi, jobApi } from '../services/api.js';

export default function ResumeAnalysisPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const preselectedJobId = searchParams.get('jobId') || '';
  const preselectedResumeId = searchParams.get('resumeId') || '';

  // Data states
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [previousAnalyses, setPreviousAnalyses] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Form states
  const [selectedResumeId, setSelectedResumeId] = useState(preselectedResumeId);
  const [selectedJobId, setSelectedJobId] = useState(preselectedJobId);

  // Action states
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgressText, setAnalysisProgressText] = useState('');
  const [error, setError] = useState(null);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [copied, setCopied] = useState(false);

  // Load candidate resumes, published jobs, and past analyses
  useEffect(() => {
    const loadInitialData = async () => {
      setDataLoading(true);
      setError(null);
      try {
        const [resumesRes, jobsRes, analysesRes] = await Promise.all([
          resumeApi.getMyResumes().catch(() => ({ data: { resumes: [] } })),
          jobApi.getPublicJobs({ status: 'published', limit: 100 }).catch(() => ({ data: { jobs: [] } })),
          resumeAnalysisApi.getMyAnalyses().catch(() => ({ data: { analyses: [] } }))
        ]);

        const readyResumes = (
          Array.isArray(resumesRes.data)
            ? resumesRes.data
            : resumesRes.data?.resumes || []
        ).filter((r) => r.status === 'ready');
        setResumes(readyResumes);

        const loadedJobs = Array.isArray(jobsRes.data)
          ? jobsRes.data
          : jobsRes.data?.jobs || [];
        setJobs(loadedJobs);

        const loadedAnalyses = Array.isArray(analysesRes.data)
          ? analysesRes.data
          : analysesRes.data?.analyses || [];
        setPreviousAnalyses(loadedAnalyses);

        // Preselect default resume if none specified
        if (!preselectedResumeId && readyResumes.length > 0) {
          const defaultResume = readyResumes.find((r) => r.isDefault) || readyResumes[0];
          setSelectedResumeId(defaultResume._id);
        } else if (preselectedResumeId) {
          setSelectedResumeId(preselectedResumeId);
        }

        if (preselectedJobId) {
          setSelectedJobId(preselectedJobId);
        }

        // If both preselected, check if an existing analysis already exists
        if (preselectedJobId && (preselectedResumeId || readyResumes.length > 0)) {
          const targetResumeId = preselectedResumeId || readyResumes[0]?._id;
          const match = loadedAnalyses.find(
            (a) =>
              (a.job?._id === preselectedJobId || a.job === preselectedJobId) &&
              (a.resume?._id === targetResumeId || a.resume === targetResumeId)
          );
          if (match) {
            setCurrentAnalysis(match);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to initialize AI Analyzer data');
      } finally {
        setDataLoading(false);
      }
    };

    loadInitialData();
  }, [preselectedJobId, preselectedResumeId]);

  const handleRunAnalysis = async (e) => {
    e.preventDefault();
    if (!selectedResumeId || !selectedJobId) {
      setError('Please select both a resume and a target job to proceed.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    // Multi-phase progress feedback simulation while awaiting backend response
    setAnalysisProgressText('Accessing verified resume text & job requirements...');
    const t1 = setTimeout(() => {
      setAnalysisProgressText('Synthesizing qualifications with Google Gemini AI...');
    }, 1200);
    const t2 = setTimeout(() => {
      setAnalysisProgressText('Evaluating skill matches and calculating affinity score...');
    }, 2500);

    try {
      const response = await resumeAnalysisApi.create({
        resumeId: selectedResumeId,
        jobId: selectedJobId
      });

      const analysis = response.data?.analysis || response.data;
      setCurrentAnalysis(analysis);

      // Refresh recent analyses
      const refreshed = await resumeAnalysisApi.getMyAnalyses();
      const updatedAnalyses = Array.isArray(refreshed.data)
        ? refreshed.data
        : refreshed.data?.analyses || [];
      setPreviousAnalyses(updatedAnalyses);

      // Scroll smoothly to results
      setTimeout(() => {
        const el = document.getElementById('analysis-results-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError(err.message || 'Failed to complete resume analysis. Please try again.');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setAnalyzing(false);
      setAnalysisProgressText('');
    }
  };

  const handleCopySummary = () => {
    if (!currentAnalysis?.summary) return;
    navigator.clipboard.writeText(currentAnalysis.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedJob = jobs.find((j) => j._id === selectedJobId);
  const selectedResume = resumes.find((r) => r._id === selectedResumeId);

  // Score color helper
  const getScoreTheme = (score) => {
    if (score >= 80) {
      return {
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.3)',
        label: 'Strong Match',
        description: 'Your profile exhibits substantial alignment with role requirements.'
      };
    }
    if (score >= 60) {
      return {
        color: '#06b6d4',
        bg: 'rgba(6, 182, 212, 0.12)',
        border: 'rgba(6, 182, 212, 0.3)',
        label: 'Good Alignment',
        description: 'Solid foundational overlap with key opportunity areas to bridge.'
      };
    }
    if (score >= 40) {
      return {
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.3)',
        label: 'Moderate Alignment',
        description: 'Partial skill overlap; strategic upskilling or framing advised.'
      };
    }
    return {
      color: '#f43f5e',
      bg: 'rgba(244, 63, 94, 0.12)',
      border: 'rgba(244, 63, 94, 0.3)',
      label: 'Growth Gap',
      description: 'Significant core skill gaps identified for this specific role.'
    };
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem' }}>
      {/* Header */}
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
            <Sparkles size={13} /> Phase 7 AI Engine
          </span>
          <span
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '20px',
              padding: '0.25rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
          >
            Google Gemini 2.0 Flash
          </span>
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          AI Resume <span className="text-gradient">Analyzer</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '720px', lineHeight: 1.6 }}>
          Run an on-demand, deep semantic evaluation comparing your uploaded resume against any published job opening.
          Uncover critical skill matches, pinpoint skill gaps, and receive tailored advice.
        </p>
      </div>

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

      {/* Main Grid: Selector Form + Previous Runs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
        {/* Left Column: Form & Active Match Generator */}
        <div className="card card-glass" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={20} color="#a855f7" /> Request AI Match Assessment
          </h2>

          {dataLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--primary-400)' }} />
              <p>Loading your resumes and open positions...</p>
            </div>
          ) : resumes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
              <FileText size={36} color="var(--primary-400)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>No Ready Resumes Found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                You need an uploaded and verified resume to perform AI analysis.
              </p>
              <Link to="/resumes" className="btn btn-primary">
                Upload Resume Now
              </Link>
            </div>
          ) : jobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px' }}>
              <Briefcase size={36} color="var(--primary-400)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>No Published Jobs Available</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                There are currently no active job postings to evaluate against.
              </p>
              <Link to="/jobs" className="btn btn-secondary">
                Browse Job Board
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRunAnalysis}>
              {/* Step 1: Select Resume */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  1. Choose Ready Resume
                </label>
                <select
                  className="input"
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  style={{ width: '100%', background: '#090d16', color: '#f8fafc', padding: '0.75rem' }}
                >
                  <option value="" disabled>-- Select a verified resume --</option>
                  {resumes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.originalFileName} {r.isDefault ? '★ (Default)' : ''}
                    </option>
                  ))}
                </select>
                {selectedResume && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ShieldCheck size={14} /> Resume verified and parsed for AI input
                  </div>
                )}
              </div>

              {/* Step 2: Select Job */}
              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  2. Select Target Published Job
                </label>
                <select
                  className="input"
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  style={{ width: '100%', background: '#090d16', color: '#f8fafc', padding: '0.75rem' }}
                >
                  <option value="" disabled>-- Select a job to evaluate --</option>
                  {jobs.map((j) => (
                    <option key={j._id} value={j._id}>
                      {j.title} — {j.company?.name || 'Company'} ({j.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Preview Summary Card */}
              {selectedJob && (
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '10px',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{selectedJob.title}</div>
                    <Link
                      to={`/jobs/${selectedJob._id}`}
                      target="_blank"
                      style={{ fontSize: '0.8rem', color: 'var(--primary-400)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      View Posting <ExternalLink size={12} />
                    </Link>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.825rem', marginBottom: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Building2 size={13} /> {selectedJob.company?.name}
                    </span>
                    <span>•</span>
                    <span>{selectedJob.workMode}</span>
                    <span>•</span>
                    <span>{selectedJob.location}</span>
                  </div>
                  {selectedJob.skillsRequired && selectedJob.skillsRequired.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {selectedJob.skillsRequired.map((s, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: 'rgba(148, 163, 184, 0.1)',
                            color: '#cbd5e1',
                            borderRadius: '6px',
                            padding: '0.15rem 0.45rem',
                            fontSize: '0.75rem'
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={analyzing || !selectedResumeId || !selectedJobId}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                {analyzing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Run AI Analysis</span>
                  </>
                )}
              </button>

              {analyzing && (
                <div style={{ marginTop: '1rem', textAlign: 'center', color: '#c4b5fd', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7' }} />
                  {analysisProgressText}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Right Column: History of Previous Analyses */}
        <div className="card card-glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="#06b6d4" /> Recent AI Evaluations
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {previousAnalyses.length} completed
            </span>
          </div>

          {previousAnalyses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={32} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.9rem' }}>No AI analyses generated yet.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Select a resume and job on the left to generate your first match report.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '420px', paddingRight: '0.25rem' }}>
              {previousAnalyses.map((item) => {
                const theme = getScoreTheme(item.matchScore);
                const isSelected = currentAnalysis?._id === item._id;
                return (
                  <div
                    key={item._id}
                    onClick={() => {
                      setCurrentAnalysis(item);
                      if (item.job?._id) setSelectedJobId(item.job._id);
                      if (item.resume?._id) setSelectedResumeId(item.resume._id);
                      const el = document.getElementById('analysis-results-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      background: isSelected ? 'rgba(124, 58, 237, 0.15)' : 'rgba(15, 23, 42, 0.4)',
                      border: isSelected ? '1px solid #7c3aed' : '1px solid var(--glass-border)',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.job?.title || 'Job Posting'}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {item.job?.company?.name || 'Company'} • {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <div
                        style={{
                          background: theme.bg,
                          color: theme.color,
                          border: `1px solid ${theme.border}`,
                          borderRadius: '8px',
                          padding: '0.25rem 0.55rem',
                          fontWeight: 700,
                          fontSize: '0.875rem'
                        }}
                      >
                        {item.matchScore}%
                      </div>
                      <ChevronRight size={15} color="var(--text-muted)" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Results Section (When an analysis is active) */}
      {currentAnalysis && (
        <div id="analysis-results-section" style={{ scrollMarginTop: '90px' }}>
          {/* Main Card */}
          <div
            className="card card-glass"
            style={{
              padding: '2.5rem',
              border: '1px solid rgba(124, 58, 237, 0.35)',
              boxShadow: '0 10px 40px -10px rgba(124, 58, 237, 0.2)'
            }}
          >
            {/* Top Bar with Match Score */}
            {(() => {
              const theme = getScoreTheme(currentAnalysis.matchScore);
              return (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1.5rem',
                    paddingBottom: '2rem',
                    borderBottom: '1px solid var(--glass-border)',
                    marginBottom: '2rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Score Circle / Badge */}
                    <div
                      style={{
                        width: '90px',
                        height: '90px',
                        borderRadius: '50%',
                        background: theme.bg,
                        border: `3px solid ${theme.color}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 0 25px ${theme.color}33`,
                        flexShrink: 0
                      }}
                    >
                      <span style={{ fontSize: '1.85rem', fontWeight: 800, color: theme.color, lineHeight: 1 }}>
                        {currentAnalysis.matchScore}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: theme.color, fontWeight: 600 }}>/ 100</span>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span
                          style={{
                            background: theme.bg,
                            color: theme.color,
                            border: `1px solid ${theme.border}`,
                            borderRadius: '20px',
                            padding: '0.2rem 0.6rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase'
                          }}
                        >
                          {theme.label}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Evaluated {new Date(currentAnalysis.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.2rem' }}>
                        {currentAnalysis.job?.title || 'Target Job Position'}
                      </h2>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {currentAnalysis.job?.company?.name} • Evaluated with resume{' '}
                        <strong style={{ color: '#f8fafc' }}>
                          {currentAnalysis.resume?.originalFileName || 'Uploaded Resume'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Top Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {currentAnalysis.job?._id && (
                      <Link
                        to={`/jobs/${currentAnalysis.job._id}/apply`}
                        className="btn btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem' }}
                      >
                        Apply for Job <ArrowRight size={15} />
                      </Link>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCopySummary}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1rem' }}
                      title="Copy analysis summary to clipboard"
                    >
                      {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                      {copied ? 'Copied!' : 'Copy Summary'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Executive Summary */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="var(--primary-400)" /> AI Executive Summary
              </h3>
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                  lineHeight: 1.7,
                  color: '#e2e8f0',
                  fontSize: '0.95rem'
                }}
              >
                {currentAnalysis.summary}
              </div>
            </div>

            {/* 2-Column Skill Analysis Grid: Matched Skills vs Missing Skills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem', marginBottom: '2.5rem' }}>
              {/* Matched Skills */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '12px',
                  padding: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <CheckCircle2 size={20} color="#10b981" />
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399', margin: 0 }}>
                    Matched Skills ({currentAnalysis.matchedSkills?.length || 0})
                  </h4>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Competencies detected in your resume that directly satisfy the employer's specifications:
                </p>

                {currentAnalysis.matchedSkills && currentAnalysis.matchedSkills.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {currentAnalysis.matchedSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#a7f3d0',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          borderRadius: '20px',
                          padding: '0.35rem 0.8rem',
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Check size={13} /> {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    No direct skill matches identified. Consider tailoring your resume terminology.
                  </div>
                )}
              </div>

              {/* Missing Skills / Skill Gaps */}
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.05)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  borderRadius: '12px',
                  padding: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <AlertTriangle size={20} color="#f43f5e" />
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fb7185', margin: 0 }}>
                    Skill Gaps Identified ({currentAnalysis.missingSkills?.length || 0})
                  </h4>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Required or preferred proficiencies not prominently reflected in your submitted resume:
                </p>

                {currentAnalysis.missingSkills && currentAnalysis.missingSkills.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {currentAnalysis.missingSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'rgba(244, 63, 94, 0.15)',
                          color: '#fecdd3',
                          border: '1px solid rgba(244, 63, 94, 0.35)',
                          borderRadius: '20px',
                          padding: '0.35rem 0.8rem',
                          fontSize: '0.825rem',
                          fontWeight: 600
                        }}
                      >
                        + {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
                    ✨ Stellar alignment! No prominent missing skills identified for this job.
                  </div>
                )}
              </div>
            </div>

            {/* Actionable Recommendations */}
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lightbulb size={18} color="#eab308" /> Strategic AI Recommendations
              </h3>

              {currentAnalysis.recommendations && currentAnalysis.recommendations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {currentAnalysis.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '10px',
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.85rem',
                        lineHeight: 1.5,
                        fontSize: '0.9rem',
                        color: '#cbd5e1'
                      }}
                    >
                      <div
                        style={{
                          background: 'rgba(124, 58, 237, 0.25)',
                          color: '#c4b5fd',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div>{rec}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No specific recommendations generated.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
