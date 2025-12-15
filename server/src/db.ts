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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

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

export interface MasterCVEntry {
  id: number;
  user_id: string;
  section_type: string;
  content: string;
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