# CareerAI — AI-Powered Career & Recruitment Platform

CareerAI is a modern, enterprise-grade MERN platform designed for candidates and recruiters. It features AI-powered resume analysis via Google Gemini, deterministic job compatibility matching, applicant tracking workflows, real-time in-app notifications, and comprehensive hiring dashboards.

---

## 1. Architecture Overview

CareerAI operates as a decoupled client-server architecture:

```
┌─────────────────────────────────┐
│     Client (React + Vite)       │
│  - Redux Toolkit State          │
│  - Role-Based Protected Routes  │
│  - Vanilla Modern CSS Tokens    │
└────────────────┬────────────────┘
                 │ HTTP / REST (withCredentials: true)
┌────────────────▼────────────────┐
│   Backend (Express + Node.js)   │
│  - JWT HttpOnly Cookie Auth     │
│  - RBAC Middleware              │
│  - Multi-Tenant Data Isolation  │
│  - Helmet & Rate Limiting       │
└───────┬──────────────┬──────────┘
        │              │
┌───────▼───────┐  ┌───▼─────────────────────┐
│    MongoDB    │  │ External Services       │
│  - Mongoose   │  │  - Google Gemini API    │
│  - Indexed    │  │  - Cloudinary Storage   │
└───────────────┘  └─────────────────────────┘
```

---

## 2. Prerequisites

- **Node.js**: `v18.0.0` or higher (verified on Node.js `v20` / `v24`)
- **npm**: `v9.0.0` or higher
- **MongoDB**: Community Server `v6.0+` or MongoDB Atlas URI (Development automatically supports isolated in-memory Mongo if local daemon is unreachable)
- **Google Gemini API Key**: For AI resume evaluation (server-side only)
- **Cloudinary Account**: Mandatory in production for secure resume storage

---

## 3. Environment Configuration

### Backend Configuration (`server/.env`)
Create `server/.env` based on `server/.env.example`:

```env
# Server Configuration
NODE_ENV=development
PORT=5001
CLIENT_URL=http://localhost:5173

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/careerai

# Security & JWT Credentials
JWT_SECRET=super_secret_jwt_access_key_careerai_2026
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=super_secret_jwt_refresh_key_careerai_2026
REFRESH_TOKEN_EXPIRES_IN=7d
COOKIE_EXPIRES_IN_DAYS=7

# Seed Administrator
ADMIN_NAME=CareerAI Platform Admin
ADMIN_EMAIL=admin@careerai.local
ADMIN_PASSWORD=Admin@CareerAI2026!

# AI Configuration (Google Gemini)
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash

# Cloud Storage (Cloudinary is mandatory in production)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
MAX_FILE_SIZE_MB=5
```

### Frontend Configuration (`client/.env`)
Create `client/.env` based on `client/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
```

> **Security Rule**: Never configure `GEMINI_API_KEY` or `JWT_SECRET` in `client/.env`. The client communicates exclusively through the backend API.

---

## 4. Local Installation & Development

### 1. Install Dependencies
```bash
# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
```

### 2. Run Local Development Servers
Run both frontend and backend concurrently from the project root:
```bash
# Start backend API (runs on http://localhost:5001)
npm run dev:server

# In a separate terminal, start frontend (runs on http://localhost:5173)
npm run dev:client
```

---

## 5. Automated Test Suites & Regression Verification

CareerAI features end-to-end automated test suites covering every development phase:

```bash
# Phase 2 — Authentication & RBAC Authorization (35 tests)
npm run test:auth

# Phase 3 — Database Models & Schema Relationships (33 tests)
npm run test:models

# Phase 4 — Company & Job Management Lifecycle (47 tests)
npm run test:phase4

# Phase 5 — Application Management & Recruiter Review (46 tests)
npm run test:phase5

# Phase 6 — Resume Management & Storage Rules (43 tests)
npm run test:phase6

# Phase 7 — AI Resume Analyzer & Google Gemini (36 tests)
npm run test:phase7

# Phase 8 — Intelligent Job Matching Engine (55 tests)
npm run test:phase8

# Phase 9 — Dashboards, Analytics & Notifications (86 tests)
npm run test:phase9

# Phase 10 — Production Hardening & Security Audit (28 tests)
npm run test:phase10
```

---

## 6. Production Build & Deployment Preparation

### Frontend Production Bundle
```bash
npm run build:client
```
The compiled SPA is output to `client/dist/` ready for static hosting (Vercel, Netlify, Cloudflare Pages, AWS S3/CloudFront). For Vercel deployments, `client/vercel.json` provides the standard SPA rewrite configuration to route all client-side routes (e.g. `/login`, `/dashboard`, `/jobs/:id`) to `index.html`.

### Backend Production Startup
In production, start the Express server using:
```bash
cd server && NODE_ENV=production npm start
```

### Production Security Hardening Highlights
- **Fail-Fast Startup**: Server validates mandatory configuration (`JWT_SECRET`, `MONGODB_URI`, `CLIENT_URL`, `CLOUDINARY_*`) at launch; fails immediately without exposing secret values.
- **Strict CORS**: Production only accepts requests from the configured `CLIENT_URL` with credentials support.
- **Rate Limiting**: Multi-tiered protection (Global: 300 req/15m, Auth: 50 req/15m, AI: 30 req/15m).
- **HTTP Security Headers**: Powered by Helmet with clickjacking denial (`X-Frame-Options: DENY`), MIME sniffing protection (`X-Content-Type-Options: nosniff`), and cross-origin resource isolation.
- **Sensitive Data Exclusion**: Passwords are excluded via Mongoose `select: false`. Resume `parsedText` is excluded from dashboards, listings, recommendations, and public feeds.
- **Error Shielding**: Production responses never leak stack traces, database driver messages, or internal connection strings.
- **File Upload Protection**: Multer in-memory storage, strict 5MB limit, PDF extension and MIME validation, plus magic byte signature checks (`%PDF-`).

---

## 7. License
ISC License — CareerAI Architecture Team.
