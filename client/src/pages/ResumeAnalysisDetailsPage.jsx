import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileText,
  Copy,
  Check,
  ArrowRight,
  Loader2,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { resumeAnalysisApi } from '../services/api.js';

export default function ResumeAnalysisDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await resumeAnalysisApi.getById(id);
        setAnalysis(response.data?.analysis);
      } catch (err) {
        setError(err.message || 'Unable to retrieve the requested AI analysis.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  const handleCopySummary = () => {
    if (!analysis?.summary) return;
    navigator.clipboard.writeText(analysis.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreTheme = (score) => {
    if (score >= 80) {
      return {
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.3)',
        label: 'Strong Match'
      };
    }
    if (score >= 60) {
      return {
        color: '#06b6d4',
        bg: 'rgba(6, 182, 212, 0.12)',
        border: 'rgba(6, 182, 212, 0.3)',
        label: 'Good Alignment'
      };
    }
    if (score >= 40) {
      return {
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.3)',
        label: 'Moderate Alignment'
      };
    }
    return {
      color: '#f43f5e',
      bg: 'rgba(244, 63, 94, 0.12)',
      border: 'rgba(244, 63, 94, 0.3)',
      label: 'Growth Gap'
    };
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 1.5rem', color: 'var(--primary-400)' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Loading AI Analysis Report...</h2>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem' }}>
        <div
          className="card card-glass"
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            textAlign: 'center',
            padding: '2.5rem',
            border: '1px solid rgba(244, 63, 94, 0.3)'
          }}
        >
          <AlertTriangle size={40} color="#f43f5e" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>Analysis Not Found or Inaccessible</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            {error || 'This analysis could not be retrieved. Ensure you are logged into the matching candidate account.'}
          </p>
          <Link to="/resume-analysis" className="btn btn-primary">
            Return to AI Analyzer
          </Link>
        </div>
      </div>
    );
  }

  const theme = getScoreTheme(analysis.matchScore);

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem' }}>
      {/* Back button */}
      <Link
        to="/resume-analysis"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          marginBottom: '2rem'
        }}
      >
        <ArrowLeft size={16} /> Back to AI Analyzer Hub
      </Link>

      {/* Hero Header Card */}
      <div
        className="card card-glass"
        style={{
          padding: '2.5rem',
          border: '1px solid rgba(124, 58, 237, 0.35)',
          boxShadow: '0 10px 40px -10px rgba(124, 58, 237, 0.2)',
          marginBottom: '2rem'
        }}
      >
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
            {/* Score Ring */}
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: theme.bg,
                border: `3px solid ${theme.color}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 30px ${theme.color}44`,
                flexShrink: 0
              }}
            >
              <span style={{ fontSize: '2.1rem', fontWeight: 800, color: theme.color, lineHeight: 1 }}>
                {analysis.matchScore}
              </span>
              <span style={{ fontSize: '0.75rem', color: theme.color, fontWeight: 600 }}>/ 100</span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                <span
                  style={{
                    background: theme.bg,
                    color: theme.color,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '20px',
                    padding: '0.2rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}
                >
                  {theme.label}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Evaluated on {new Date(analysis.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>

              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.3rem' }}>
                {analysis.job?.title || 'Target Job Title'}
              </h1>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Building2 size={15} color="var(--primary-400)" />
                  {analysis.job?.company?.name || 'Company'}
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <FileText size={15} color="#38bdf8" />
                  Resume: <strong style={{ color: '#f8fafc' }}>{analysis.resume?.originalFileName || 'Attached Resume'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {analysis.job?._id && (
              <Link
                to={`/jobs/${analysis.job._id}/apply`}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.4rem' }}
              >
                Apply for Position <ArrowRight size={16} />
              </Link>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCopySummary}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.7rem 1.1rem' }}
            >
              {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy Summary'}
            </button>
          </div>
        </div>

        {/* Executive Summary */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="var(--primary-400)" /> Gemini Executive Analysis
          </h3>
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '1.4rem 1.6rem',
              lineHeight: 1.75,
              color: '#e2e8f0',
              fontSize: '0.975rem'
            }}
          >
            {analysis.summary}
          </div>
        </div>

        {/* Skill Matching Grid */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <CheckCircle2 size={20} color="#10b981" />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399', margin: 0 }}>
                Matched Skills ({analysis.matchedSkills?.length || 0})
              </h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Specific skills identified in your resume that fulfill the job's stated requirements:
            </p>

            {analysis.matchedSkills && analysis.matchedSkills.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {analysis.matchedSkills.map((skill, idx) => (
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
                No direct skill matches identified.
              </div>
            )}
          </div>

          {/* Missing Skills */}
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.05)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <AlertTriangle size={20} color="#f43f5e" />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fb7185', margin: 0 }}>
                Skill Gaps ({analysis.missingSkills?.length || 0})
              </h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Employer criteria that were missing or not clearly emphasized in your parsed resume:
            </p>

            {analysis.missingSkills && analysis.missingSkills.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {analysis.missingSkills.map((skill, idx) => (
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
                ✨ Excellent alignment! No major missing skills flagged.
              </div>
            )}
          </div>
        </div>

        {/* Actionable Recommendations */}
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lightbulb size={20} color="#eab308" /> Recommended Enhancements
          </h3>

          {analysis.recommendations && analysis.recommendations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {analysis.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '10px',
                    padding: '1.1rem 1.35rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                    lineHeight: 1.5,
                    fontSize: '0.925rem',
                    color: '#cbd5e1'
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(124, 58, 237, 0.25)',
                      color: '#c4b5fd',
                      borderRadius: '50%',
                      width: '26px',
                      height: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
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
              No specific recommendations provided.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
