# CyberShield Security Toolkit

A comprehensive, unified web-based cybersecurity platform providing integrated security testing, audit logging, and analysis tools.

---

## Overview

CyberShield is a unified, standalone **Next.js 15 App Router** application that merges a premium dark cybersecurity interface with a secure serverless backend. It integrates **Supabase** for user authentication and PostgreSQL database storage, while executing network scans directly on the server. 

If Supabase is unconfigured, the application automatically launches in an **offline sandbox fallback mode** using a local JSON database file (`cybershield-db.json`) and client-side session simulations, ensuring full portability.

---

## Architecture & Tech Stack

- **Core Framework**: Next.js 15 (React 19, TypeScript)
- **Styling**: Tailwind CSS & Vanilla CSS
- **Authentication**: Supabase Auth (integrated client-side and verified server-side via custom request context headers)
- **Database**: Supabase Database (PostgreSQL) or Local JSON Fallback DB (`cybershield-db.json`)
- **Report Generation**: PDF compilation via `pdfkit` and CSV serialization
- **Contextual Copilot**: Rules-based AI Security Assistant matching NIST, CIS, and OWASP guides depending on the active page.

---

## Workspace Structure

```
CyberShield/
├── src/
│   ├── app/              # Next.js App Router (Pages & API routes)
│   │   ├── api/          # Server Route Handlers (scans, tools, reports, admin)
│   │   ├── admin/        # Admin Dashboard Console
│   │   ├── dashboard/    # User Dashboard Console
│   │   ├── login/        # Identity Authentication console
│   │   └── tools/        # Port scanner, vulnerability, passwords, hashes, file integrity, URL reputation pages
│   ├── components/       # Layout, Navbar, Sidebar, and AI Assistant widgets
│   └── lib/              # Supabase clients, database interface wrappers, auth stores, and utility helpers
├── public/               # Static assets & favicon files
├── package.json          # Standard project dependencies & scripts
├── tsconfig.json         # TypeScript compiler configurations
├── .env.example          # Template environment configuration file
└── README.md             # This documentation file
```

---

## Quick Start Setup

### 1. Install Dependencies
Run the standard npm installation at the project root folder:
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
By default, the `.env` template holds placeholder values. If left as-is, the application will start in **Offline Fallback Mode**, simulating user authentications in `localStorage` and writing database tables locally to `cybershield-db.json` in the root workspace directory.

### 3. Start Local Development Server
Launch the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 4. Build for Production
Verify that all TypeScript code, routes, and page styles compile without warnings:
```bash
npm run build
npm run start
```

---

## Sandbox Login Credentials (Offline Fallback Mode)

When running in offline fallback mode, the credentials screen accepts any email with specific naming patterns to grant role clearance levels:
- **Administrator Access**: Use any email containing `admin` (e.g., `admin@cybershield.com`) with any password.
- **Security Analyst Access**: Use any email containing `analyst` (e.g., `analyst@cybershield.com`) with any password.
- **Student Access**: Use any standard email (e.g., `student@cybershield.com`). Student accounts are watermarked and restricted to scanning safety targets (`scanme.nmap.org` or `localhost`).

---

## Supabase Database Integration (Optional)

To integrate production database and authentications:

### 1. Create a Supabase Project
Sign up at [supabase.com](https://supabase.com) and create a new project.

### 2. Set Database Tables
In your Supabase SQL editor, execute the following schema script:

```sql
-- Profiles table mapped to auth.users
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'STUDENT',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scan jobs table
CREATE TABLE scan_jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  target TEXT NOT NULL,
  scanConfig JSONB,
  status TEXT NOT NULL DEFAULT 'PENDING',
  results JSONB,
  errorMsg TEXT,
  userId UUID REFERENCES auth.users ON DELETE SET NULL,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completedAt TIMESTAMPTZ
);

-- File hashes (FIM) table
CREATE TABLE file_hashes (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  fileSize BIGINT NOT NULL,
  sha256 TEXT NOT NULL,
  userId UUID REFERENCES auth.users ON DELETE SET NULL,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- URL analysis cache table
CREATE TABLE url_analyses (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  reputation TEXT NOT NULL,
  riskScore INT NOT NULL,
  analysis TEXT NOT NULL,
  indicators JSONB,
  userId UUID REFERENCES auth.users ON DELETE SET NULL,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiresAt TIMESTAMPTZ NOT NULL
);

-- Reports table
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  format TEXT NOT NULL,
  filename TEXT NOT NULL,
  content TEXT NOT NULL, -- base64 representation
  jobIds TEXT[] NOT NULL,
  userId UUID REFERENCES auth.users ON DELETE SET NULL,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiresAt TIMESTAMPTZ NOT NULL
);

-- Rate limits configurations
CREATE TABLE rate_limits (
  id TEXT PRIMARY KEY,
  tool TEXT NOT NULL UNIQUE,
  limit INT NOT NULL,
  window INT NOT NULL
);

-- Seed default rate limits
INSERT INTO rate_limits (id, tool, limit, window) VALUES
  ('1', 'authentication', 5, 900),
  ('2', 'port_scan', 10, 3600),
  ('3', 'vulnerability_scan', 5, 3600),
  ('4', 'file_check', 20, 3600),
  ('5', 'url_analysis', 50, 3600)
ON CONFLICT (tool) DO NOTHING;

-- Audit logging table
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  userId UUID,
  action TEXT NOT NULL,
  actionType TEXT NOT NULL,
  ipAddress TEXT NOT NULL,
  outcome TEXT NOT NULL,
  metadata JSONB,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3. Configure Env Variables
Update your local `.env` file with credentials obtained from your Supabase Project Settings:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-public-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key" # required for server-side user provisioning
```
Once configured, restart the server (`npm run dev`). Authentication, audits, tool metrics, and scan results will automatically synchronize with Supabase.
