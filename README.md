# HireIQ

### AI-Powered Applicant Tracking System

HireIQ is a full-stack Applicant Tracking System (ATS) designed to help recruitment teams manage jobs, candidates, applications, resume screening, interviews, notifications, and hiring analytics from a unified workspace.

The platform combines a modern recruiter dashboard with AI-assisted resume analysis and candidate matching to reduce manual screening effort and simplify the overall hiring workflow.

---

## Overview

Modern recruitment teams often manage resumes, job openings, candidate information, interview schedules, and hiring insights across multiple tools.

HireIQ brings these workflows together into a centralized recruitment workspace.

The platform allows recruiters to:

- Manage job openings
- Manage candidates
- Upload and process resumes
- Extract candidate information from resumes
- Perform AI-assisted candidate screening
- Track applications
- Schedule interviews
- Receive recruitment notifications
- Monitor hiring analytics
- Manage recruiter profile and workspace settings

---

## Key Features

### Authentication

- Recruiter registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Protected frontend routes
- Authenticated API access

### Recruiter Dashboard

- Candidate overview
- Active jobs overview
- Application metrics
- Interview metrics
- Recruitment pipeline
- AI screening insights
- Upcoming interviews
- Recent recruitment activity

### Job Management

- Create job openings
- View job openings
- Update job information
- Delete job openings
- Track applications associated with jobs

### Candidate Management

- Add candidates
- Upload resumes
- View candidate information
- Manage candidate profiles
- Track skills and experience
- View resume-derived information

### AI-Powered Resume Screening

- Resume upload
- PDF and DOCX processing
- Candidate information extraction
- AI-assisted resume analysis
- Candidate-to-job evaluation
- AI match score generation
- Screening-based candidate ranking

### Application Tracking

- Create applications
- Track candidate applications
- Manage application status
- View AI screening results
- Associate candidates with jobs
- Monitor the recruitment pipeline

### Interview Management

- Schedule interviews
- View upcoming interviews
- Track interview status
- Associate interviews with candidates and jobs
- Generate interview notifications

### Notifications

- Interview notifications
- Unread notification indicator
- Mark notification as read
- Mark all notifications as read
- Delete notifications

### Analytics

- Recruitment overview
- Application pipeline
- Candidate metrics
- Interview metrics
- AI screening statistics
- Hiring trends

### Settings

- Recruiter profile management
- Profile photo management
- Notification preferences
- AI automation preferences
- Password management interface
- Active session management

---

## AI Screening Workflow

```text
Resume Upload
      ↓
Resume Parsing
      ↓
Candidate Information Extraction
      ↓
Job Requirement Context
      ↓
AI Candidate Screening
      ↓
Match Score
      ↓
Candidate Ranking
      ↓
Recruiter Review
```

---

## Core Recruiter Workflow

```text
Login
  ↓
Dashboard
  ↓
Create Job
  ↓
Add / Upload Candidate
  ↓
Resume Processing
  ↓
AI Screening
  ↓
Application Review
  ↓
Candidate Ranking
  ↓
Schedule Interview
  ↓
Notifications
  ↓
Hiring Analytics
```

---

## System Architecture

```text
                    ┌──────────────────────┐
                    │       Recruiter      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    React Frontend    │
                    │      HireIQ UI       │
                    └──────────┬───────────┘
                               │
                            REST API
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Node.js + Express  │
                    │      Backend         │
                    └───────┬───────┬──────┘
                            │       │
                            ▼       ▼
                    ┌──────────┐ ┌──────────────┐
                    │PostgreSQL│ │  Gemini API  │
                    │ Database │ │ AI Screening │
                    └──────────┘ └──────────────┘
                            │
                            ▼
                    ┌──────────────────────┐
                    │ Resume Processing    │
                    │ PDF / DOCX Parsing   │
                    └──────────────────────┘
```

---

## Tech Stack

### Frontend

- React
- JavaScript
- HTML5
- CSS3
- React Router
- Vite
- Lucide React

### Backend

- Node.js
- Express.js
- REST APIs

### Database

- PostgreSQL

### Authentication

- JWT
- bcrypt

### AI

- Google Gemini API

### Resume Processing

- PDF parsing
- DOCX parsing
- AI-assisted resume information extraction

---

## Project Structure

```text
hireiq/
│
├── server/
│   ├── config/
│   │   ├── db.js
│   │   └── schema.sql
│   │
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── uploads/
│   └── server.js
│
├── src/
│   ├── components/
│   │   ├── sidebar.jsx
│   │   └── topbar.jsx
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Jobs.jsx
│   │   ├── Candidate.jsx
│   │   ├── Application.jsx
│   │   ├── Interview.jsx
│   │   ├── Analytics.jsx
│   │   ├── settings.jsx
│   │   ├── Login.jsx
│   │   ├── CandidateDetails/
│   │   └── CandidateProfile/
│   │
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
│
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── vite.config.js
```

---

## Getting Started

### Prerequisites

Before running HireIQ locally, make sure the following are installed:

- Node.js
- npm
- PostgreSQL
- Git

### Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/hireiq.git
cd hireiq
```

### Install Frontend Dependencies

From the project root:

```bash
npm install
```

### Install Backend Dependencies

Move into the backend directory:

```bash
cd server
npm install
```

### Environment Variables

Create a `.env` file inside the `server` directory:

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

> Never commit `.env` files or expose API keys, database credentials, or JWT secrets publicly.

### Database Setup

HireIQ uses PostgreSQL as its primary database.

Create a PostgreSQL database and configure the connection through:

```text
server/config/db.js
```

The database schema is available at:

```text
server/config/schema.sql
```

Run the schema against your PostgreSQL database before starting the backend.

### Start the Backend

From the `server` directory:

```bash
npm run dev
```

The backend will run on:

```text
http://localhost:5000
```

### Start the Frontend

Open a new terminal and return to the project root:

```bash
cd ..
npm run dev
```

Vite will provide the local development URL, typically:

```text
http://localhost:5173
```

Open the URL in your browser to access HireIQ.

### Production Build

To generate the optimized frontend build:

```bash
npm run build
```

The production frontend build will be generated inside:

```text
dist/
```

---

## API Modules

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Jobs

```text
GET    /api/jobs
POST   /api/jobs
GET    /api/jobs/:id
PUT    /api/jobs/:id
DELETE /api/jobs/:id
```

### Candidates

```text
GET  /api/candidates
POST /api/candidates
```

### Applications

```text
GET  /api/applications
POST /api/applications
```

### Resume Processing

```text
POST /api/resumes/upload
```

### AI Screening

```text
POST /api/ai/screen/:applicationId
```

### Interviews

```text
GET    /api/interviews
GET    /api/interviews/:id
POST   /api/interviews
PUT    /api/interviews/:id
DELETE /api/interviews/:id
```

### Notifications

```text
GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
DELETE /api/notifications/:id
```

### Analytics

```text
GET /api/analytics/dashboard
GET /api/analytics/hiring-trends
```

---

## Security

HireIQ currently includes:

- JWT-based authentication
- bcrypt password hashing
- Protected frontend routes
- Authenticated API requests
- Environment-based secret configuration
- Resume file validation
- `.env` protection through `.gitignore`
- User-scoped recruitment data

Sensitive credentials such as API keys, database connection strings, and JWT secrets should always remain in environment variables.

---

## UI & Product Design

HireIQ follows a modern enterprise SaaS design approach focused on recruiter productivity, information clarity, and efficient hiring workflows.

### Design Principles

- Dark green visual identity
- Clean dashboard hierarchy
- Responsive layouts
- Light and dark themes
- Rounded card-based interface
- Consistent spacing and typography
- AI-focused visual elements
- Data-driven recruitment insights
- Recruiter-friendly navigation

The interface is designed to keep high-value recruitment information accessible while maintaining a clean and structured workspace.

---

## Screenshots

### Dashboard

_Add dashboard screenshot here._

### Job Management

_Add job management screenshot here._

### Candidate Management

_Add candidate management screenshot here._

### AI Screening

_Add AI screening screenshot here._

### Interview Management

_Add interview management screenshot here._

### Analytics

_Add analytics screenshot here._

---

## Future Improvements

- Cloud-based resume storage
- Email integration
- Calendar integration
- Advanced role-based access control
- Multi-user organization support
- Recruiter collaboration
- Automated candidate communication
- Advanced AI recommendation workflows
- Interview feedback automation
- Advanced candidate search
- Production cloud deployment
- Enhanced recruitment reporting
- Advanced hiring intelligence

---

## Project Status

See [authentication and verification](docs/authentication.md) for session behavior,
API configuration, and commands to run the regression tests.

**Status: Functional Full-Stack Prototype**

Currently implemented:

- Authentication
- JWT-based protected access
- PostgreSQL integration
- Job management
- Candidate management
- Resume upload and parsing
- AI-assisted resume screening
- Candidate-job matching
- Application tracking
- Interview scheduling
- Notifications
- Hiring analytics
- Recruiter settings
- Responsive recruiter dashboard
- Production frontend build

HireIQ currently demonstrates a complete portfolio-oriented full-stack ATS workflow combining modern frontend development, REST API integration, authentication, database management, resume processing, and AI-assisted recruitment functionality.

---

## License

This project is intended for educational, portfolio, and demonstration purposes.
