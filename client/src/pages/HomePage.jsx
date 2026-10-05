import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Sparkles,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  Activity,
  Layers,
  Lock,
  UserCheck
} from 'lucide-react';

export default function HomePage({ backendMeta }) {
  const apiStatus = useSelector((state) => state.ui.apiStatus);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const phases = [
    { num: 'Phase 0', title: 'Architecture & Planning', status: 'completed', desc: 'System specs, schemas & roadmap' },
    { num: 'Phase 1', title: 'Monorepo & Foundation', status: 'completed', desc: 'Vite React + Express API + Design Tokens' },
    { num: 'Phase 2', title: 'Authentication & RBAC', status: 'completed', desc: 'JWT, HttpOnly cookies & role authorization' },
    { num: 'Phase 3', title: 'Database Models & Relationships', status: 'completed', desc: 'Core Mongoose schemas & relationships' },
    { num: 'Phase 4', title: 'Company & Job Management', status: 'completed', desc: 'Recruiter lifecycle, candidate search & filters' },
    { num: 'Phase 5', title: 'Application Management', status: 'completed', desc: 'Candidate submissions, tracking & recruiter review board' },
    { num: 'Phase 6', title: 'Resume Management & Parsing', status: 'next', desc: 'PDF upload, text extraction & resume manager' },
    { num: 'Phase 7', title: 'AI Matching Engine', status: 'pending', desc: 'Resume-job match & skill-gap audit' },
    { num: 'Phase 8', title: 'Dashboards & Analytics', status: 'pending', desc: 'Candidate & Recruiter metrics' },
    { num: 'Phase 9', title: 'Notifications & Alerts', status: 'pending', desc: 'In-app notification subsystem' },
    { num: 'Phase 10', title: 'Security & Production Ready', status: 'pending', desc: 'Pen-testing, audit & optimization' }
  ];

  return (
    <main className="container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <span className="badge badge-cyan">
            <Sparkles size={13} /> Next-Gen AI Career Infrastructure
          </span>
        </div>

        <h1 className="hero-title">
          Intelligent Hiring & Career Growth, <br />
          <span className="text-gradient">Powered by Modern AI</span>
        </h1>

        <p className="hero-subtitle">
          A production full-stack MERN platform uniting Candidates, Recruiters, and Admins with automated resume
          critique, contextual ATS skill-gap analysis, and hiring intelligence.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          <Link to="/jobs" className="btn btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={17} />
            <span>Explore Jobs</span>
          </Link>

          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
              <span>Enter Workspace ({user?.name.split(' ')[0]})</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
                <span>Create an Account</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-glass" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
                <Lock size={16} />
                <span>Sign In</span>
              </Link>
            </>
          )}
        </div>

        {/* Live System Health Pill */}
        <div className="status-pill">
          <Activity size={16} className={apiStatus === 'connected' ? 'text-emerald' : 'text-muted'} />
          <span>
            <strong>Backend Node Service:</strong>{' '}
            {backendMeta ? `${backendMeta.platform} (${backendMeta.environment} mode)` : 'Awaiting handshake'}
          </span>
          {backendMeta && (
            <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>
              Operational
            </span>
          )}
        </div>
      </section>

      {/* 3 Core Roles Section */}
      <section style={{ margin: '2rem 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="badge badge-primary">Platform Ecosystem</span>
          <h2 style={{ fontSize: '2rem', marginTop: '0.75rem' }}>Architected for Three Dedicated Audiences</h2>
          <p className="text-secondary" style={{ marginTop: '0.5rem' }}>
            Distinct authorization scopes, data models, and personalized interfaces.
          </p>
        </div>

        <div className="portal-grid">
          {/* Candidate Card */}
          <div className="card card-glass card-interactive portal-card">
            <div className="portal-icon">
              <FileText size={24} />
            </div>
            <div className="badge badge-cyan" style={{ marginBottom: '0.75rem' }}>
              Role: Candidate
            </div>
            <h3>Candidates & Job Seekers</h3>
            <p>
              Build verified profiles, upload resume PDFs, run AI job-match scans, and receive tailored skill-gap
              suggestions before applying.
            </p>
            <ul className="feature-list">
              <li>
                <CheckCircle2 size={15} /> AI Resume Match & ATS Critique
              </li>
              <li>
                <CheckCircle2 size={15} /> Real-Time Application Tracking
              </li>
              <li>
                <CheckCircle2 size={15} /> Profile & Skills Matrix Builder
              </li>
            </ul>
            <Link
              to="/register"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--accent-cyan)'
              }}
            >
              Sign Up as Candidate <ArrowRight size={14} />
            </Link>
          </div>

          {/* Recruiter Card */}
          <div className="card card-glass card-interactive portal-card">
            <div
              className="portal-icon"
              style={{
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                borderColor: 'rgba(59, 130, 246, 0.25)'
              }}
            >
              <Briefcase size={24} />
            </div>
            <div className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>
              Role: Recruiter
            </div>
            <h3>Recruiters & Companies</h3>
            <p>
              Manage company profiles, publish job postings with structured criteria, evaluate candidates with AI
              match scores, and progress hiring stages.
            </p>
            <ul className="feature-list">
              <li>
                <CheckCircle2 size={15} /> Company Profile & Verification
              </li>
              <li>
                <CheckCircle2 size={15} /> Job Posting & Lifecycle Engine
              </li>
              <li>
                <CheckCircle2 size={15} /> Kanban Applicant Tracking (ATS)
              </li>
            </ul>
            <Link
              to="/register"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--primary-400)'
              }}
            >
              Sign Up as Recruiter <ArrowRight size={14} />
            </Link>
          </div>

          {/* Admin Card */}
          <div className="card card-glass card-interactive portal-card">
            <div
              className="portal-icon"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                borderColor: 'rgba(16, 185, 129, 0.25)'
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div className="badge badge-success" style={{ marginBottom: '0.75rem' }}>
              Role: Administrator
            </div>
            <h3>Platform Governance</h3>
            <p>
              Complete governance across users, recruiters, company verifications, reported content moderation, and
              macro-level platform analytics.
            </p>
            <ul className="feature-list">
              <li>
                <CheckCircle2 size={15} /> User & Recruiter Moderation
              </li>
              <li>
                <CheckCircle2 size={15} /> Company Verification Queue
              </li>
              <li>
                <CheckCircle2 size={15} /> Platform KPIs & Content Reports
              </li>
            </ul>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--accent-emerald)'
              }}
            >
              Provisioned via Seed Script
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Phase Architecture Roadmap Overview */}
      <section className="roadmap-section">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="badge badge-primary">
            <Layers size={13} /> Engineering Blueprint
          </span>
          <h2 style={{ fontSize: '2rem', marginTop: '0.75rem' }}>Multi-Phase Implementation Track</h2>
          <p className="text-secondary" style={{ marginTop: '0.5rem' }}>
            Following strict incremental phase boundaries. Review progress and upcoming milestones below.
          </p>
        </div>

        <div className="roadmap-grid">
          {phases.map((p) => (
            <div
              key={p.num}
              className={`phase-item ${
                p.status === 'completed' ? 'completed' : p.status === 'next' ? 'active' : ''
              }`}
            >
              <div className="phase-header">
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color:
                      p.status === 'completed'
                        ? 'var(--accent-emerald)'
                        : p.status === 'next'
                        ? 'var(--primary-400)'
                        : 'var(--text-muted)'
                  }}
                >
                  {p.num}
                </span>
                {p.status === 'completed' ? (
                  <CheckCircle2 size={16} color="var(--accent-emerald)" />
                ) : p.status === 'next' ? (
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                    Ready Next
                  </span>
                ) : (
                  <Clock size={15} color="var(--text-muted)" />
                )}
              </div>
              <div className="phase-title">{p.title}</div>
              <div className="phase-desc">{p.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
