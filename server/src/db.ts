import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), '../../resumai.db');
export const db = new Database(dbPath);

// Users table - stores Google OAuth users
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    picture TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// User CVs table - stores complete CV data per user
db.exec(`
  CREATE TABLE IF NOT EXISTS user_cvs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT DEFAULT 'My CV',
    cv_data TEXT NOT NULL,
    template TEXT DEFAULT 'harvard',
    is_master BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS master_cv (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT DEFAULT 'default',
    section_type TEXT NOT NULL,
    content TEXT NOT NULL,
    visible INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

try {
  db.exec(`ALTER TABLE master_cv ADD COLUMN visible INTEGER DEFAULT 1`);
  console.log('✅ SQLite Database Migration: Added visible column to master_cv');
} catch (err) {
  // Ignored if column already exists
}

// Startup cleanup: Deduplicate existing master_cv records
try {
  db.exec(`
    DELETE FROM master_cv WHERE id NOT IN (
      SELECT MIN(id) FROM master_cv GROUP BY user_id, section_type, content
    )
  `);
  console.log('✅ SQLite Database Migration: Cleaned up duplicate master_cv records');
} catch (err) {
  console.error('⚠️ SQLite Database Migration warning:', err);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS email_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT DEFAULT 'default',
    recipient_email TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recipient_email)
  )
`);

// Tailored CVs table - stores job-specific CV versions
db.exec(`
  CREATE TABLE IF NOT EXISTS tailored_cvs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    master_cv_version TEXT,
    job_title TEXT NOT NULL,
    company TEXT NOT NULL,
    job_description TEXT,
    match_score INTEGER,
    ats_score INTEGER,
    content TEXT NOT NULL,
    injected_keywords TEXT,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_at DATETIME
  )
`);

// Job queue table - for batch application processing
db.exec(`
  CREATE TABLE IF NOT EXISTS job_queue (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    job_description TEXT NOT NULL,
    job_url TEXT,
    company TEXT,
    title TEXT,
    status TEXT DEFAULT 'pending',
    tailored_cv_id TEXT,
    match_score INTEGER,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    FOREIGN KEY (tailored_cv_id) REFERENCES tailored_cvs(id)
  )
`);

// User preferences table - for learning from suggestion feedback
db.exec(`
  CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    suggestion_type TEXT NOT NULL,
    original_text TEXT,
    suggested_text TEXT,
    accepted BOOLEAN,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// CV analysis cache - for storing analysis results
db.exec(`
  CREATE TABLE IF NOT EXISTS cv_analysis_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    analysis_type TEXT NOT NULL,
    input_hash TEXT NOT NULL,
    result TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    UNIQUE(user_id, analysis_type, input_hash)
  )
`);

// CV Store - JSON Resume format storage
db.exec(`
  CREATE TABLE IF NOT EXISTS cv_store (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    cv_data TEXT NOT NULL,
    quality_score INTEGER DEFAULT 0,
    template_id TEXT DEFAULT 'gold-standard',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// CV Change History - for undo/restore functionality
db.exec(`
  CREATE TABLE IF NOT EXISTS cv_change_history (
    id TEXT PRIMARY KEY,
    cv_id TEXT NOT NULL,
    change_type TEXT NOT NULL,
    changes TEXT,
    previous_state TEXT NOT NULL,
    new_state TEXT NOT NULL,
    score_before INTEGER,
    score_after INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cv_id) REFERENCES cv_store(id)
  )
`);

// Create indexes for efficient history queries
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_cv_history_cv_id ON cv_change_history(cv_id)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_cv_history_created ON cv_change_history(created_at DESC)
`);

// ============================================
// PERSONAL JOB APPLICATION ASSISTANT TABLES
// ============================================

// Projects table - User's portfolio projects
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    tech_stack TEXT NOT NULL,
    url TEXT,
    highlights TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Job postings table - Extracted job information
db.exec(`
  CREATE TABLE IF NOT EXISTS job_postings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    salary TEXT,
    requirements TEXT NOT NULL,
    skills TEXT NOT NULL,
    recruiter_email TEXT,
    raw_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Tailored CVs table - Job-specific CV versions
db.exec(`
  CREATE TABLE IF NOT EXISTS tailored_cvs_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    job_posting_id TEXT NOT NULL,
    cv_data TEXT NOT NULL,
    changes TEXT,
    match_score INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (job_posting_id) REFERENCES job_postings(id)
  )
`);

// Cover letters table
db.exec(`
  CREATE TABLE IF NOT EXISTS cover_letters (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    job_posting_id TEXT NOT NULL,
    content TEXT NOT NULL,
    tone TEXT DEFAULT 'professional',
    quality_score INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (job_posting_id) REFERENCES job_postings(id)
  )
`);

// Applications table - Track sent applications
db.exec(`
  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    job_posting_id TEXT NOT NULL,
    tailored_cv_id TEXT,
    cover_letter_id TEXT,
    email_sent BOOLEAN DEFAULT 0,
    recruiter_email TEXT,
    status TEXT DEFAULT 'draft',
    sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (job_posting_id) REFERENCES job_postings(id),
    FOREIGN KEY (tailored_cv_id) REFERENCES tailored_cvs_new(id),
    FOREIGN KEY (cover_letter_id) REFERENCES cover_letters(id)
  )
`);

// ============================================
// AUTO REMOTE JOB HUNTER TABLES
// ============================================

// Scout settings - user preferences for job scouting
db.exec(`
  CREATE TABLE IF NOT EXISTS scout_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE,
    remote_only BOOLEAN DEFAULT 1,
    preferred_locations TEXT DEFAULT '[]',
    excluded_companies TEXT DEFAULT '[]',
    min_match_score INTEGER DEFAULT 40,
    max_applications_per_day INTEGER DEFAULT 10,
    auto_apply BOOLEAN DEFAULT 0,
    require_human_review BOOLEAN DEFAULT 1,
    job_types TEXT DEFAULT '["full-time","contract"]',
    salary_min INTEGER,
    salary_currency TEXT DEFAULT 'USD',
    preferred_keywords TEXT DEFAULT '[]',
    excluded_keywords TEXT DEFAULT '["senior","lead","principal","manager"]',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

try {
  db.exec(`ALTER TABLE scout_settings ADD COLUMN slack_token TEXT`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE scout_settings ADD COLUMN slack_channels TEXT DEFAULT '[]'`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE scout_settings ADD COLUMN slack_cookie TEXT`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE scout_settings ADD COLUMN target_role TEXT DEFAULT 'Full Stack Engineer'`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE scout_settings ADD COLUMN preferred_tone TEXT DEFAULT 'professional'`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE scout_settings ADD COLUMN automation_priority TEXT DEFAULT 'balanced'`);
} catch (e) {}

// Automation rules - learn which jobs can be automated vs need human
db.exec(`
  CREATE TABLE IF NOT EXISTS automation_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    rule_type TEXT NOT NULL,
    pattern TEXT NOT NULL,
    action TEXT NOT NULL,
    confidence REAL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Job market cache - cached job market analysis data
db.exec(`
  CREATE TABLE IF NOT EXISTS job_market_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    skill TEXT NOT NULL,
    demand_count INTEGER DEFAULT 0,
    avg_salary TEXT,
    market_trend TEXT DEFAULT 'stable',
    source TEXT DEFAULT 'scrape',
    cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    UNIQUE(user_id, skill, source)
  )
`);

// CV evolution data - track CV improvements over time
db.exec(`
  CREATE TABLE IF NOT EXISTS cv_evolution_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    cv_version TEXT NOT NULL,
    change_type TEXT NOT NULL,
    section TEXT,
    old_content TEXT,
    new_content TEXT,
    match_score_before INTEGER,
    match_score_after INTEGER,
    applied_from TEXT DEFAULT 'manual',
    feedback_score INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Scraped jobs cache - store jobs found from aggregator
db.exec(`
  CREATE TABLE IF NOT EXISTS scraped_jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    description TEXT,
    url TEXT,
    source TEXT NOT NULL,
    salary TEXT,
    skills TEXT DEFAULT '[]',
    remote BOOLEAN DEFAULT 1,
    match_score INTEGER,
    automation_score INTEGER,
    status TEXT DEFAULT 'new',
    applied BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Create indexes for efficient queries
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_job_postings_user_id ON job_postings(user_id)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_tailored_cvs_user_id ON tailored_cvs_new(user_id)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_tailored_cvs_job_id ON tailored_cvs_new(job_posting_id)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON cover_letters(user_id)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_scraped_jobs_user_id ON scraped_jobs(user_id)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_scraped_jobs_status ON scraped_jobs(status)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_cv_evolution_user_id ON cv_evolution_data(user_id)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_market_cache_skill ON job_market_cache(user_id, skill)
`);

export interface MasterCVEntry {
  id: number;
  user_id: string;
  section_type: string;
  content: string;
  visible?: number;
  created_at: string;
}

export interface TailoredCV {
  id: string;
  user_id: string;
  master_cv_version: string | null;
  job_title: string;
  company: string;
  job_description: string | null;
  match_score: number | null;
  ats_score: number | null;
  content: string;
  injected_keywords: string | null;
  status: 'draft' | 'ready' | 'sent';
  created_at: string;
  updated_at: string;
  sent_at: string | null;
}

export interface JobQueueItem {
  id: string;
  user_id: string;
  job_description: string;
  job_url: string | null;
  company: string | null;
  title: string | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  tailored_cv_id: string | null;
  match_score: number | null;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface UserPreference {
  id: number;
  user_id: string;
  suggestion_type: string;
  original_text: string | null;
  suggested_text: string | null;
  accepted: boolean;
  created_at: string;
}

// ============================================
// PERSONAL JOB APPLICATION ASSISTANT TYPES
// ============================================

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  tech_stack: string;
  url?: string;
  highlights?: string;
  created_at: string;
  updated_at: string;
}

export interface JobPosting {
  id: string;
  user_id: string;
  title: string;
  company: string;
  location?: string;
  salary?: string;
  requirements: string;
  skills: string;
  recruiter_email?: string;
  raw_text: string;
  created_at: string;
}

export interface TailoredCVRecord {
  id: string;
  user_id: string;
  job_posting_id: string;
  cv_data: string;
  changes?: string;
  match_score?: number;
  created_at: string;
}

export interface CoverLetter {
  id: string;
  user_id: string;
  job_posting_id: string;
  content: string;
  tone: string;
  quality_score?: number;
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  job_posting_id: string;
  tailored_cv_id?: string;
  cover_letter_id?: string;
  email_sent: boolean;
  recruiter_email: string;
  status: string;
  sent_at?: string;
  created_at: string;
}