import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { jobApi, companyApi } from '../services/api.js';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  DollarSign,
  AlertCircle,
  Loader2,
  Save,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function JobFormPage({ isEdit = false }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [company, setCompany] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills: '',
    location: '',
    employmentType: 'full-time',
    workMode: 'onsite',
    experienceMin: 0,
    experienceMax: '',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'USD',
    status: 'published' // Default to published or draft
  });

  useEffect(() => {
    const initializeForm = async () => {
      try {
        // 1. Verify company association
        try {
          const compRes = await companyApi.getMine();
          setCompany(compRes.data);
        } catch (compErr) {
          if (compErr.statusCode === 404) {
            setCompany(null);
          }
        }

        // 2. If editing, load job details
        if (isEdit && id) {
          const jobRes = await jobApi.getRecruiterJobById(id);
          const job = jobRes.data;
          setFormData({
            title: job.title || '',
            description: job.description || '',
            skills: Array.isArray(job.skills) ? job.skills.join(', ') : '',
            location: job.location || '',
            employmentType: job.employmentType || 'full-time',
            workMode: job.workMode || 'onsite',
            experienceMin: job.experienceMin ?? 0,
            experienceMax: job.experienceMax ?? '',
            salaryMin: job.salaryMin ?? '',
            salaryMax: job.salaryMax ?? '',
            salaryCurrency: job.salaryCurrency || 'USD',
            status: job.status || 'published'
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to initialize form');
      } finally {
        setLoading(false);
      }
    };

    initializeForm();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (submitStatus) => {
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        status: submitStatus || formData.status,
        experienceMin: Number(formData.experienceMin) || 0,
        experienceMax: formData.experienceMax !== '' ? Number(formData.experienceMax) : undefined,
        salaryMin: formData.salaryMin !== '' ? Number(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax !== '' ? Number(formData.salaryMax) : undefined
      };

      if (isEdit && id) {
        await jobApi.updateRecruiterJob(id, payload);
      } else {
        await jobApi.createRecruiterJob(payload);
      }

      navigate('/recruiter/jobs');
    } catch (err) {
      setError(err.message || 'Failed to save job posting');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <Loader2 size={36} color="var(--primary-400)" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading job configuration...</span>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '850px' }}>
      {/* Back Link */}
      <Link
        to="/recruiter/jobs"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          marginBottom: '1.75rem'
        }}
      >
        <ArrowLeft size={16} /> Back to My Jobs
      </Link>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
          {isEdit ? 'Update Existing Posting' : 'Role Publisher'}
        </span>
        <h1 style={{ fontSize: '2rem' }}>{isEdit ? 'Edit Job Posting' : 'Create New Career Opening'}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
          Define the job requirements, target competencies, and compensation details.
        </p>
      </div>

      {/* Missing Company Guard Warning */}
      {!company && (
        <div
          className="card card-glass"
          style={{
            padding: '1.75rem',
            marginBottom: '2rem',
            borderLeft: '4px solid var(--accent-rose)',
            background: 'rgba(244, 63, 94, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <Building2 size={24} color="var(--accent-rose)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>Company Profile Required</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                You must set up your company profile before creating job postings. Jobs automatically inherit your company's branding and verification status.
              </p>
              <Link to="/recruiter/company" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                Setup Company Now
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
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
            gap: '0.65rem'
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Job Form Card */}
      <div className="card card-glass" style={{ padding: '2.5rem' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(formData.status); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Job Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Job Title *
            </label>
            <input
              type="text"
              name="title"
              className="form-input"
              placeholder="e.g. Senior Full-Stack Engineer"
              value={formData.title}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={150}
              disabled={!company}
            />
          </div>

          {/* Location & Work Mode & Employment Type */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Location *
              </label>
              <input
                type="text"
                name="location"
                className="form-input"
                placeholder="e.g. San Francisco, CA or Remote"
                value={formData.location}
                onChange={handleChange}
                required
                disabled={!company}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Work Mode *
              </label>
              <select name="workMode" className="form-input" value={formData.workMode} onChange={handleChange} disabled={!company}>
                <option value="onsite">On-Site</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Fully Remote</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Employment Type *
              </label>
              <select name="employmentType" className="form-input" value={formData.employmentType} onChange={handleChange} disabled={!company}>
                <option value="full-time">Full-Time</option>
                <option value="part-time">Part-Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>
          </div>

          {/* Skills Required */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Target Skills & Competencies (comma-separated)
            </label>
            <input
              type="text"
              name="skills"
              className="form-input"
              placeholder="e.g. react, node.js, mongodb, typescript, docker"
              value={formData.skills}
              onChange={handleChange}
              disabled={!company}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              These skills will be used by the AI engine for resume matching and candidate discovery.
            </span>
          </div>

          {/* Experience Range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Minimum Experience (Years)
              </label>
              <input
                type="number"
                name="experienceMin"
                className="form-input"
                min="0"
                value={formData.experienceMin}
                onChange={handleChange}
                disabled={!company}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Maximum Experience (Years, optional)
              </label>
              <input
                type="number"
                name="experienceMax"
                className="form-input"
                min="0"
                placeholder="No upper limit"
                value={formData.experienceMax}
                onChange={handleChange}
                disabled={!company}
              />
            </div>
          </div>

          {/* Salary Range & Currency */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Minimum Salary (Annual)
              </label>
              <input
                type="number"
                name="salaryMin"
                className="form-input"
                min="0"
                placeholder="e.g. 100000"
                value={formData.salaryMin}
                onChange={handleChange}
                disabled={!company}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Maximum Salary (Annual)
              </label>
              <input
                type="number"
                name="salaryMax"
                className="form-input"
                min="0"
                placeholder="e.g. 140000"
                value={formData.salaryMax}
                onChange={handleChange}
                disabled={!company}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Currency
              </label>
              <input
                type="text"
                name="salaryCurrency"
                className="form-input"
                value={formData.salaryCurrency}
                onChange={handleChange}
                maxLength={5}
                disabled={!company}
              />
            </div>
          </div>

          {/* Description Textarea */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Full Job Description * (min. 20 characters)
            </label>
            <textarea
              name="description"
              className="form-input"
              rows={8}
              placeholder="Outline the responsibilities, qualifications, team structure, and day-to-day work..."
              value={formData.description}
              onChange={handleChange}
              required
              minLength={20}
              disabled={!company}
            />
          </div>

          {/* Submit Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginTop: '1rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--glass-border)'
            }}
          >
            <Link to="/recruiter/jobs" className="btn btn-secondary">
              Cancel
            </Link>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {/* Draft Button */}
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={submitting || !company}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Save size={15} />
                <span>Save as Draft</span>
              </button>

              {/* Publish Button */}
              <button
                type="button"
                onClick={() => handleSubmit('published')}
                disabled={submitting || !company}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1.4rem' }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>{isEdit ? 'Update & Publish' : 'Publish Job'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
