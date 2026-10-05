import React from 'react';

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--glass-border)',
        padding: '2.5rem 0',
        marginTop: 'auto',
        background: 'rgba(9, 13, 22, 0.95)'
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.875rem',
          color: 'var(--text-muted)'
        }}
      >
        <div>© 2026 CareerAI Platform. Built with MERN + Modular AI Architecture.</div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span>REST API: Port 5001</span>
          <span>Auth & RBAC: Active</span>
          <span>Phase 2 Verified</span>
        </div>
      </div>
    </footer>
  );
}
