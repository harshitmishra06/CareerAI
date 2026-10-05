import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { resumeApi } from '../services/api.js';
import {
  FileText,
  Upload,
  CheckCircle2,
  Star,
  Trash2,
  Download,
  AlertCircle,
  Loader2,
  Calendar,
  HardDrive,
  Check,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function CandidateResumesPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef(null);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await resumeApi.getMyResumes();
      setResumes(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setError('Only PDF documents are allowed (.pdf)');
        setSelectedFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Selected file exceeds the 5 MB upload limit');
        setSelectedFile(null);
        return;
      }
      setError(null);
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);
      setSuccessMsg(null);

      const formData = new FormData();
      formData.append('resume', selectedFile);

      await resumeApi.upload(formData);
      setSuccessMsg(`"${selectedFile.name}" uploaded and parsed successfully!`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await fetchResumes();
    } catch (err) {
      setError(err.message || 'Upload failed. Please check the file and try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSetDefault = async (resumeId) => {
    try {
      setActionLoadingId(resumeId);
      setError(null);
      setSuccessMsg(null);
      await resumeApi.selectDefault(resumeId);
      setSuccessMsg('Default resume updated successfully');
      await fetchResumes();
    } catch (err) {
      setError(err.message || 'Failed to update default resume');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (resume) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${resume.originalFileName}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      setActionLoadingId(resume._id);
      setError(null);
      setSuccessMsg(null);
      await resumeApi.delete(resume._id);
      setSuccessMsg(`"${resume.originalFileName}" deleted successfully`);
      await fetchResumes();
    } catch (err) {
      setError(err.message || 'Could not delete resume');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDownload = async (resume) => {
    try {
      setActionLoadingId(`dl-${resume._id}`);
      const blob = await resumeApi.downloadFile(resume._id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', resume.originalFileName || 'resume.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Failed to download resume file');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.15)',
              padding: '0.6rem',
              borderRadius: '10px',
              color: '#818cf8',
              display: 'inline-flex'
            }}
          >
            <FileText size={28} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>
            Resume Management
          </h1>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0 }}>
          Upload, organize, and manage your CVs for job applications. Set a default resume for seamless 1-click applications.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.95rem' }}>{error}</span>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            color: '#6ee7b7',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}
        >
          <Check size={20} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.95rem' }}>{successMsg}</span>
        </div>
      )}

      {/* Upload Box */}
      <div
        className="card"
        style={{
          background: 'rgba(30, 41, 59, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.75rem',
          marginBottom: '2.5rem',
          backdropFilter: 'blur(12px)'
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
          Upload New Resume
        </h2>

        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              border: '2px dashed rgba(99, 102, 241, 0.35)',
              borderRadius: '12px',
              padding: '2rem 1.5rem',
              textAlign: 'center',
              background: 'rgba(15, 23, 42, 0.4)',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem'
              }}
            >
              <Upload size={24} />
            </div>

            {selectedFile ? (
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, color: '#f1f5f9', fontSize: '1.05rem' }}>
                  {selectedFile.name}
                </p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                  {formatFileSize(selectedFile.size)} • Ready to upload
                </p>
              </div>
            ) : (
              <div>
                <p style={{ margin: '0 0 0.35rem 0', fontWeight: 600, color: '#e2e8f0' }}>
                  Click to select or drop your resume here
                </p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                  PDF documents only (%PDF- signature verified) • Max 5 MB
                </p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            {selectedFile && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={uploading}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!selectedFile || uploading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Uploading & Parsing...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload Resume
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Resumes List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
            Your Resumes ({resumes.length})
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Protected with application-attachment safeguards
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto', color: '#818cf8' }} />
            <p style={{ margin: 0 }}>Loading your uploaded resumes...</p>
          </div>
        ) : resumes.length === 0 ? (
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '3.5rem 1.5rem',
              textAlign: 'center'
            }}
          >
            <FileText size={42} style={{ color: '#64748b', margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
              No resumes uploaded yet
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto' }}>
              Upload your resume in PDF format above so you can attach it to job applications with 1 click.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {resumes.map((resume) => {
              const isDefault = resume.isDefault;
              const isLoadingThis = actionLoadingId === resume._id;
              const isDownloadingThis = actionLoadingId === `dl-${resume._id}`;

              return (
                <div
                  key={resume._id}
                  className="card"
                  style={{
                    background: isDefault ? 'rgba(30, 41, 59, 0.85)' : 'rgba(30, 41, 59, 0.5)',
                    border: isDefault ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.5rem',
                    flexWrap: 'wrap',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 300px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: isDefault ? 'rgba(99, 102, 241, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                        color: isDefault ? '#818cf8' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <FileText size={22} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontWeight: 600,
                            color: '#f8fafc',
                            fontSize: '1rem',
                            wordBreak: 'break-word'
                          }}
                        >
                          {resume.originalFileName}
                        </span>

                        {isDefault && (
                          <span
                            style={{
                              background: 'rgba(99, 102, 241, 0.2)',
                              color: '#a5b4fc',
                              border: '1px solid rgba(99, 102, 241, 0.35)',
                              borderRadius: '20px',
                              padding: '0.15rem 0.55rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <Star size={11} fill="#a5b4fc" /> Default Resume
                          </span>
                        )}

                        <span
                          style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#6ee7b7',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            borderRadius: '20px',
                            padding: '0.15rem 0.55rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <ShieldCheck size={12} /> Ready
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          marginTop: '0.35rem',
                          fontSize: '0.85rem',
                          color: '#94a3b8'
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <HardDrive size={13} /> {formatFileSize(resume.fileSize)}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Calendar size={13} />{' '}
                          {new Date(resume.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {!isDefault && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleSetDefault(resume._id)}
                        disabled={isLoadingThis}
                        style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        title="Make this your default resume for future job applications"
                      >
                        {isLoadingThis ? <Loader2 size={13} className="animate-spin" /> : <Star size={13} />}
                        Set as Default
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleDownload(resume)}
                      disabled={isDownloadingThis}
                      style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      title="Download PDF"
                    >
                      {isDownloadingThis ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                      Download
                    </button>

                    {resume.status === 'ready' && (
                      <Link
                        to={`/resume-analysis?resumeId=${resume._id}`}
                        className="btn btn-secondary"
                        style={{
                          fontSize: '0.85rem',
                          padding: '0.45rem 0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: 'rgba(124, 58, 237, 0.12)',
                          borderColor: 'rgba(124, 58, 237, 0.35)',
                          color: '#c4b5fd'
                        }}
                        title="Analyze this resume against open positions"
                      >
                        <Sparkles size={13} color="#a855f7" />
                        AI Analyze
                      </Link>
                    )}

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleDelete(resume)}
                      disabled={isLoadingThis}
                      style={{
                        fontSize: '0.85rem',
                        padding: '0.45rem 0.65rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.25)'
                      }}
                      title="Delete resume (Protected if attached to active applications)"
                    >
                      {isLoadingThis ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
