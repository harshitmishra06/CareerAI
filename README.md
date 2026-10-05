# CareerAI — AI-Powered Career & Recruitment Platform

CareerAI is a MERN-based career and recruitment platform for candidates and recruiters, featuring AI-powered resume analysis, job matching, applications, recruitment workflows, and dashboards.

## Tech Stack

* React + Vite
* Redux Toolkit
* Node.js
* Express.js
* MongoDB + Mongoose
* Google Gemini API
* Cloudinary
* JWT Authentication

## Features

* Candidate and recruiter authentication
* Role-based access control
* Candidate and recruiter profiles
* Resume upload and management
* AI-powered resume analysis
* Job creation and management
* Job compatibility matching
* Job applications and ATS workflow
* Dashboards and analytics
* In-app notifications
* Secure file storage

## Project Structure

```text
CareerAI/
├── client/
├── server/
├── package.json
└── README.md
```

## Requirements

* Node.js 18+
* npm 9+
* MongoDB / MongoDB Atlas
* Google Gemini API key
* Cloudinary account

## Setup

Clone the repository:

```bash
git clone <repository-url>
cd CareerAI
```

Install dependencies:

```bash
cd server
npm install

cd ../client
npm install
```

Create the environment files:

```text
server/.env
client/.env
```

Use the provided `.env.example` files as references.

**Do not commit `.env` files or API keys.**

## Run Locally

Start the backend:

```bash
npm run dev:server
```

Start the frontend in another terminal:

```bash
npm run dev:client
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:5001
```

## Build

```bash
npm run build:client
```

## License

ISC
