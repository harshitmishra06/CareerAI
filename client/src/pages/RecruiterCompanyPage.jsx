import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { companyApi } from '../services/api.js';
import {
  Building2,
  Globe,
  MapPin,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PlusCircle,
  Edit3,
  Briefcase,
  ArrowRight
} from 'lucide-react';

export default function RecruiterCompanyPage() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    companySize: '11-50',
    location: '',
    website: '',
    foundedYear: '',
    description: ''
  });

  const fetchCompany = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await companyApi.getMine();
      setCompany(response.data);
      setFormData({
        name: response.data.name || '',
        industry: response.data.industry || '',
        companySize: response.data.companySize || '11-50',
        location: response.data.location || '',
        website: response.data.website || '',
        foundedYear: response.data.foundedYear || '',
        description: response.data.description || ''
      });
    } catch (err) {
      if (err.statusCode === 404) {
        setCompany(null);
      } else {
        setError(err.message || 'Failed to load company profile');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg('');

    try {
      if (company) {
        // Update existing company
        const res = await companyApi.updateMine(formData);
        setCompany(res.data);
        setIsEditing(false);
        setSuccessMsg('Company profile updated successfully!');
      } else {
        // Create new company
        const res = await companyApi.create(formData);
        setCompany(res.data);
        setIsEditing(false);
        setSuccessMsg('Company profile established successfully!');
      }
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <Loader2 size={36} color="var(--primary-400)" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading company profile...</span>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '880px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
            Recruiter Workspace
          </span>
          <h1 style={{ fontSize: '2rem' }}>Company Profile Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {company
              ? 'Manage your organization profile, verified branding, and hiring association.'
              : 'Set up your company profile to start publishing job openings.'}
          </p>
        </div>

        {company && !isEditing && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setIsEditing(true)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Edit3 size={15} /> Edit Details
            </button>
            <Link to="/recruiter/jobs/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <PlusCircle size={15} /> Create a Job
            </Link>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
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

      {/* Company View Card (When Company Exists & Not Editing) */}
      {company && !isEditing ? (
        <div className="card card-glass" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
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
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.35)'
              }}
            >
              <Building2 size={32} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h2 style={{ fontSize: '1.65rem' }}>{company.name}</h2>
                {company.isVerified ? (
                  <span className="badge badge-success">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                ) : (
                  <span className="badge badge-cyan" title="Company verification reviewed by admin">
                    Standard Profile
                  </span>
                )}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Slug identifier: <code style={{ color: 'var(--primary-400)' }}>/companies/{company.slug}</code>
              </div>
            </div>
          </div>

          {/* Grid Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                Industry Sector
              </span>
              <strong style={{ fontSize: '1rem' }}>{company.industry || 'Not specified'}</strong>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                Company Size
              </span>
              <strong style={{ fontSize: '1rem' }}>{company.companySize ? `${company.companySize} employees` : 'Not specified'}</strong>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                Headquarters
              </span>
              <strong style={{ fontSize: '1rem' }}>{company.location || 'Not specified'}</strong>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                Founded Year
              </span>
              <strong style={{ fontSize: '1rem' }}>{company.foundedYear || 'Not specified'}</strong>
            </div>
          </div>

          {/* Website Link */}
          {company.website && (
            <div style={{ marginBottom: '1.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                Official Website
              </span>
              <a
                href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)' }}
              >
                {company.website} <Globe size={14} />
              </a>
            </div>
          )}

          {/* Description */}
          {company.description && (
            <div style={{ marginBottom: '2.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                Company Summary
              </span>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.925rem' }}>{company.description}</p>
            </div>
          )}

          {/* Quick Action Navigation Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
            <Link to="/recruiter/jobs" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-400)', fontSize: '0.9rem' }}>
              <Briefcase size={15} /> Manage Published Jobs
            </Link>

            <Link to="/recruiter/jobs/new" className="btn btn-primary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.875rem' }}>
              <span>Post New Role</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      ) : (
        /* Company Create / Edit Form */
        <div className="card card-glass" style={{ padding: '2.5rem' }}>
          <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>
            {company ? 'Edit Company Information' : 'Set Up Your Organization'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem' }}>
            Fill in the details below to establish your recruiter organization profile.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Company Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Company Name *
              </label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="e.g. Acme Innovations Corp"
                value={formData.name}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={100}
              />
            </div>

            {/* Industry & Size */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Industry
                </label>
                <input
                  type="text"
                  name="industry"
                  className="form-input"
                  placeholder="e.g. Artificial Intelligence, FinTech"
                  value={formData.industry}
                  onChange={handleChange}
                  maxLength={100}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Company Size
                </label>
                <select name="companySize" className="form-input" value={formData.companySize} onChange={handleChange}>
                  <option value="1-10">1-10 Employees</option>
                  <option value="11-50">11-50 Employees</option>
                  <option value="51-200">51-200 Employees</option>
                  <option value="201-500">201-500 Employees</option>
                  <option value="501-1000">501-1000 Employees</option>
                  <option value="1000+">1000+ Employees</option>
                </select>
              </div>
            </div>

            {/* Location & Founded Year */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Headquarters Location
                </label>
                <input
                  type="text"
                  name="location"
                  className="form-input"
                  placeholder="e.g. San Francisco, CA or Remote"
                  value={formData.location}
                  onChange={handleChange}
                  maxLength={150}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Founded Year
                </label>
                <input
                  type="number"
                  name="foundedYear"
                  className="form-input"
                  placeholder="e.g. 2021"
                  min="1800"
                  max={new Date().getFullYear() + 1}
                  value={formData.foundedYear}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Website URL */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Website URL
              </label>
              <input
                type="url"
                name="website"
                className="form-input"
                placeholder="https://example.com"
                value={formData.website}
                onChange={handleChange}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Company Summary & Mission
              </label>
              <textarea
                name="description"
                className="form-input"
                rows={4}
                placeholder="Tell candidates about your company mission, tech stack, and workplace culture..."
                value={formData.description}
                onChange={handleChange}
                maxLength={3000}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              {company && (
                <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">
                  Cancel
                </button>
              )}
              <button type="submit" disabled={submitting} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                {submitting ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{company ? 'Update Company Profile' : 'Complete Company Setup'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
