import axios from 'axios';

// Normalize API base URL (strips trailing slashes and corrects accidental /v1/api path ordering)
let rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1').trim().replace(/\/+$/, '');
if (rawBaseUrl.endsWith('/v1/api')) {
  rawBaseUrl = rawBaseUrl.replace(/\/v1\/api$/, '/api/v1');
}
const API_BASE_URL = rawBaseUrl;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Request interceptor: attach Bearer token from localStorage for cross-site browser fallback
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('careerai_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for unified response handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      message: error.response?.data?.error?.message || error.message || 'An unexpected error occurred',
      code: error.response?.data?.error?.code || 'UNKNOWN_ERROR',
      statusCode: error.response?.status || 500,
      details: error.response?.data?.error?.details || null
    };
    return Promise.reject(customError);
  }
);

export const healthApi = {
  check: () => apiClient.get('/health')
};

export const authApi = {
  register: (userData) => apiClient.post('/auth/register', userData),
  login: (credentials) => apiClient.post('/auth/login', credentials),
  getMe: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout')
};

export const companyApi = {
  getMine: () => apiClient.get('/companies/me'),
  create: (data) => apiClient.post('/companies', data),
  updateMine: (data) => apiClient.patch('/companies/me', data),
  getById: (id) => apiClient.get(`/companies/${id}`)
};

export const jobApi = {
  // Public / Candidate
  getPublicJobs: (params) => apiClient.get('/jobs', { params }),
  getPublicJobById: (id) => apiClient.get(`/jobs/${id}`),

  // Recruiter
  getRecruiterJobs: (params) => apiClient.get('/jobs/recruiter/me', { params }),
  getRecruiterJobById: (id) => apiClient.get(`/jobs/recruiter/${id}`),
  createRecruiterJob: (data) => apiClient.post('/jobs/recruiter', data),
  updateRecruiterJob: (id, data) => apiClient.patch(`/jobs/recruiter/${id}`, data),
  updateJobStatus: (id, status) => apiClient.patch(`/jobs/recruiter/${id}/status`, { status })
};

export const applicationApi = {
  // Candidate
  apply: (data) => apiClient.post('/applications', data),
  getMyApplications: (params) => apiClient.get('/applications/me', { params }),
  getApplicationById: (id) => apiClient.get(`/applications/${id}`),
  withdraw: (id) => apiClient.patch(`/applications/${id}/withdraw`),

  // Recruiter
  getJobApplications: (jobId, params) => apiClient.get(`/jobs/${jobId}/applications`, { params }),
  updateStatus: (id, status) => apiClient.patch(`/applications/${id}/status`, { status })
};

export const resumeApi = {
  // Candidate
  upload: (formData) =>
    apiClient.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getMyResumes: () => apiClient.get('/resumes'),
  getById: (id) => apiClient.get(`/resumes/${id}`),
  selectDefault: (id) => apiClient.patch(`/resumes/${id}/default`),
  delete: (id) => apiClient.delete(`/resumes/${id}`),
  getFileDownloadUrl: (id) => `${API_BASE_URL}/resumes/${id}/file`,
  downloadFile: (id) =>
    apiClient.get(`/resumes/${id}/file`, {
      responseType: 'blob'
    })
};

export const resumeAnalysisApi = {
  create: (data) => apiClient.post('/resume-analyses', data),
  getMyAnalyses: (params) => apiClient.get('/resume-analyses/me', { params }),
  getById: (id) => apiClient.get(`/resume-analyses/${id}`)
};

export const analysisApi = resumeAnalysisApi;

export const jobMatchApi = {
  getMatches: (params) => apiClient.get('/job-matches', { params }),
  getMatchDetails: (jobId) => apiClient.get(`/job-matches/${jobId}`)
};

export const dashboardApi = {
  getCandidateDashboard: () => apiClient.get('/dashboard/candidate'),
  getEmployerDashboard: () => apiClient.get('/dashboard/employer'),
  getCandidateAnalytics: () => apiClient.get('/dashboard/candidate/analytics'),
  getEmployerAnalytics: () => apiClient.get('/dashboard/employer/analytics')
};

export const notificationApi = {
  getNotifications: (params) => apiClient.get('/notifications', { params }),
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),
  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.patch('/notifications/read-all')
};

export default apiClient;
