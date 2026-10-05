import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setApiStatus } from './store/slices/uiSlice.js';
import { fetchCurrentUser } from './store/slices/authSlice.js';
import { healthApi } from './services/api.js';

import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardTestPage from './pages/DashboardTestPage.jsx';
import UnauthorizedPage from './pages/UnauthorizedPage.jsx';
import JobsPage from './pages/JobsPage.jsx';
import JobDetailsPage from './pages/JobDetailsPage.jsx';
import RecruiterCompanyPage from './pages/RecruiterCompanyPage.jsx';
import RecruiterJobsPage from './pages/RecruiterJobsPage.jsx';
import JobFormPage from './pages/JobFormPage.jsx';
import ApplyJobPage from './pages/ApplyJobPage.jsx';
import CandidateApplicationsPage from './pages/CandidateApplicationsPage.jsx';
import CandidateApplicationDetailsPage from './pages/CandidateApplicationDetailsPage.jsx';
import CandidateResumesPage from './pages/CandidateResumesPage.jsx';
import ResumeAnalysisPage from './pages/ResumeAnalysisPage.jsx';
import ResumeAnalysisDetailsPage from './pages/ResumeAnalysisDetailsPage.jsx';
import JobMatchesPage from './pages/JobMatchesPage.jsx';
import RecruiterJobApplicationsPage from './pages/RecruiterJobApplicationsPage.jsx';
import CandidateDashboardPage from './pages/CandidateDashboardPage.jsx';
import EmployerDashboardPage from './pages/EmployerDashboardPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';

import './App.css';

export default function App() {
  const dispatch = useDispatch();
  const [backendMeta, setBackendMeta] = useState(null);
  const [latency, setLatency] = useState(null);

  useEffect(() => {
    // 1. Restore authenticated user session via HttpOnly cookie
    dispatch(fetchCurrentUser());

    // 2. Initial backend health handshake
    const checkBackend = async () => {
      const startTime = performance.now();
      try {
        const response = await healthApi.check();
        const endTime = performance.now();
        setLatency(Math.round(endTime - startTime));
        setBackendMeta(response.data);
        dispatch(setApiStatus('connected'));
      } catch (err) {
        console.error('Backend health check error:', err);
        dispatch(setApiStatus('disconnected'));
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <Navbar latency={latency} />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage backendMeta={backendMeta} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailsPage />} />

          {/* Candidate Resume & Application Routes */}
          <Route
            path="/resumes"
            element={
              <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                <CandidateResumesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:id/apply"
            element={
              <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                <ApplyJobPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                <CandidateApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications/:id"
            element={
              <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                <CandidateApplicationDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume-analysis"
            element={
              <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                <ResumeAnalysisPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume-analysis/:id"
            element={
              <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                <ResumeAnalysisDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/job-matches"
            element={
              <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                <JobMatchesPage />
              </ProtectedRoute>
            }
          />

          {/* Recruiter & Admin Protected Routes */}
          <Route
            path="/recruiter/company"
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                <RecruiterCompanyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/jobs"
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                <RecruiterJobsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/jobs/new"
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                <JobFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/jobs/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                <JobFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/jobs/:id/applications"
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                <RecruiterJobApplicationsPage />
              </ProtectedRoute>
            }
          />

          {/* Candidate Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                <CandidateDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Employer Dashboard */}
          <Route
            path="/employer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                <EmployerDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* In-App Notifications */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Footer />
      </div>
    </BrowserRouter>
  );
}
