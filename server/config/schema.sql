/* =========================================================
   HIREIQ DATABASE SCHEMA
   ========================================================= */

CREATE EXTENSION IF NOT EXISTS pgcrypto;


/* =========================================================
   USERS
   ========================================================= */

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,

    email VARCHAR(150) UNIQUE NOT NULL,

    password_hash TEXT NOT NULL,

    role VARCHAR(30) DEFAULT 'recruiter',

    avatar_url TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


/* =========================================================
   JOBS
   ========================================================= */

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    title VARCHAR(150) NOT NULL,

    department VARCHAR(100),

    location VARCHAR(150),

    employment_type VARCHAR(50) DEFAULT 'Full-time',

    experience_level VARCHAR(50),

    description TEXT,

    requirements TEXT,

    salary_min NUMERIC,

    salary_max NUMERIC,

    status VARCHAR(30) DEFAULT 'Active',

    applications_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_jobs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


/* =========================================================
   CANDIDATES
   ========================================================= */

CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(120) NOT NULL,

    email VARCHAR(150),

    phone VARCHAR(30),

    location VARCHAR(150),

    headline VARCHAR(200),

    experience_years NUMERIC(4,1),

    skills TEXT,

    education TEXT,

    resume_url TEXT,

    profile_image_url TEXT,

    status VARCHAR(30) DEFAULT 'Available',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


/* =========================================================
   APPLICATIONS
   ========================================================= */

CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    job_id UUID NOT NULL,

    candidate_id UUID NOT NULL,

    status VARCHAR(30) DEFAULT 'Screening',

    ai_match_score NUMERIC(5,2),

    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_applications_job
        FOREIGN KEY (job_id)
        REFERENCES jobs(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_applications_candidate
        FOREIGN KEY (candidate_id)
        REFERENCES candidates(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_job_candidate
        UNIQUE (job_id, candidate_id)
);


/* =========================================================
   AI SCREENINGS
   ========================================================= */

CREATE TABLE IF NOT EXISTS ai_screenings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    application_id UUID NOT NULL,

    match_score NUMERIC(5,2),

    confidence_score NUMERIC(5,2),

    skills_match_score NUMERIC(5,2),

    experience_match_score NUMERIC(5,2),

    education_match_score NUMERIC(5,2),

    matched_skills TEXT,

    missing_skills TEXT,

    recommendation TEXT,

    ai_summary TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ai_screening_application
        FOREIGN KEY (application_id)
        REFERENCES applications(id)
        ON DELETE CASCADE
);


/* =========================================================
   INTERVIEWS
   ========================================================= */

CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    application_id UUID NOT NULL,

    interviewer_id UUID,

    interview_type VARCHAR(50) DEFAULT 'Video',

    scheduled_at TIMESTAMP NOT NULL,

    duration_minutes INTEGER DEFAULT 30,

    meeting_link TEXT,

    location VARCHAR(200),

    status VARCHAR(30) DEFAULT 'Scheduled',

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_interviews_application
        FOREIGN KEY (application_id)
        REFERENCES applications(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_interviews_interviewer
        FOREIGN KEY (interviewer_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    title VARCHAR(200) NOT NULL,

    message TEXT,

    type VARCHAR(50) DEFAULT 'general',

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


/* =========================================================
   INDEXES
   ========================================================= */

CREATE INDEX IF NOT EXISTS idx_jobs_user_id
ON jobs(user_id);

CREATE INDEX IF NOT EXISTS idx_jobs_status
ON jobs(status);

CREATE INDEX IF NOT EXISTS idx_candidates_email
ON candidates(email);

CREATE INDEX IF NOT EXISTS idx_applications_job_id
ON applications(job_id);

CREATE INDEX IF NOT EXISTS idx_applications_candidate_id
ON applications(candidate_id);

CREATE INDEX IF NOT EXISTS idx_applications_status
ON applications(status);

CREATE INDEX IF NOT EXISTS idx_ai_screenings_application_id
ON ai_screenings(application_id);

CREATE INDEX IF NOT EXISTS idx_interviews_application_id
ON interviews(application_id);

CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at
ON interviews(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
ON notifications(user_id);


/* =========================================================
   DONE
   ========================================================= */

SELECT 'HireIQ database schema created successfully' AS message;