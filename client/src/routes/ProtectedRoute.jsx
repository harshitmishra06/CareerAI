import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const { user, isAuthenticated, isInitialized } = useSelector((state) => state.auth);

  // While restoring session from HttpOnly cookie on initial page load
  if (!isInitialized) {
    return (
      <div
        style={{
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem'
        }}
      >
        <Loader2 size={36} className="animate-glow" color="var(--primary-400)" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Verifying CareerAI session...</span>
      </div>
    );
  }

  // If unauthenticated, redirect to login with original location state
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role authorization is specified, verify user has permitted role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
