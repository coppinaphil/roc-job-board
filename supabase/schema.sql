-- Jobs table with AI enhancement capabilities
CREATE TABLE jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  -- Basic job information
  title text NOT NULL,
  company text NOT NULL,
  location text,
  description text,
  url text, -- Link to original job posting
  
  -- Salary information
  salary_min integer,
  salary_max integer,
  salary_currency text DEFAULT 'USD',
  salary_period text DEFAULT 'yearly', -- yearly, monthly, hourly
  
  -- Employment details
  employment_type text DEFAULT 'full-time', -- full-time, part-time, contract, internship, temporary
  remote_ok boolean DEFAULT false,
  experience_level text, -- entry, junior, mid, senior, executive, intern
  education_required text, -- high_school, associate, bachelor, master, phd, none
  
  -- AI-enhanced fields (populated by LLM processing)
  skills_required jsonb DEFAULT '[]'::jsonb,
  skills_preferred jsonb DEFAULT '[]'::jsonb,
  industry text,
  department text,
  benefits jsonb DEFAULT '[]'::jsonb,
  requirements jsonb DEFAULT '[]'::jsonb,
  
  -- Work details
  work_schedule text, -- standard, flexible, shift, on-call
  travel_required text DEFAULT 'none', -- none, minimal, occasional, frequent
  security_clearance boolean DEFAULT false,
  
  -- AI processing metadata
  source text, -- where the job was scraped from
  quality_score integer CHECK (quality_score >= 1 AND quality_score <= 10),
  processing_notes text,
  ai_enhanced boolean DEFAULT false,
  processed_at timestamp with time zone,
  
  -- Publishing workflow
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'rejected')),
  published_at timestamp with time zone,
  archived_at timestamp with time zone,
  
  -- Additional metadata
  view_count integer DEFAULT 0,
  application_count integer DEFAULT 0,
  featured boolean DEFAULT false,
  expires_at timestamp with time zone
);

-- Companies table (separate for better data management)
CREATE TABLE companies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  name text NOT NULL UNIQUE,
  slug text UNIQUE, -- for URLs like /companies/xerox
  description text,
  website text,
  logo_url text,
  size_category text, -- startup, small, medium, large, enterprise
  industry text,
  headquarters text,
  
  -- Social/contact
  linkedin_url text,
  twitter_url text,
  email text,
  
  -- Stats
  total_jobs integer DEFAULT 0,
  verified boolean DEFAULT false
);

-- Add company relationship to jobs
ALTER TABLE jobs ADD COLUMN company_id uuid REFERENCES companies(id);

-- Job Applications (for tracking)
CREATE TABLE job_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_email text,
  applicant_name text,
  resume_url text,
  cover_letter text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'interviewing', 'rejected', 'hired')),
  
  -- Track source
  source text, -- direct, indeed, linkedin, etc.
  referrer text
);

-- Saved Jobs (for job seekers)
CREATE TABLE saved_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  user_email text, -- Simple email-based tracking for now
  
  UNIQUE(job_id, user_email)
);

-- Performance indexes
CREATE INDEX jobs_published_idx ON jobs (status, published_at DESC) WHERE status = 'published';
CREATE INDEX jobs_location_idx ON jobs (location) WHERE status = 'published';
CREATE INDEX jobs_company_idx ON jobs (company_id, status);
CREATE INDEX jobs_skills_gin_idx ON jobs USING gin (skills_required);
CREATE INDEX jobs_search_idx ON jobs USING gin (to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX jobs_quality_idx ON jobs (quality_score DESC) WHERE status = 'published';

-- Company indexes
CREATE INDEX companies_slug_idx ON companies (slug);
CREATE INDEX companies_name_idx ON companies (name);

-- Application indexes
CREATE INDEX job_applications_job_idx ON job_applications (job_id, created_at DESC);
CREATE INDEX job_applications_status_idx ON job_applications (status, created_at DESC);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update company job count
CREATE OR REPLACE FUNCTION update_company_job_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.company_id IS NOT NULL AND NEW.status = 'published' THEN
        UPDATE companies SET total_jobs = total_jobs + 1 WHERE id = NEW.company_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes
        IF OLD.status != 'published' AND NEW.status = 'published' AND NEW.company_id IS NOT NULL THEN
            UPDATE companies SET total_jobs = total_jobs + 1 WHERE id = NEW.company_id;
        ELSIF OLD.status = 'published' AND NEW.status != 'published' AND OLD.company_id IS NOT NULL THEN
            UPDATE companies SET total_jobs = total_jobs - 1 WHERE id = OLD.company_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.company_id IS NOT NULL AND OLD.status = 'published' THEN
        UPDATE companies SET total_jobs = total_jobs - 1 WHERE id = OLD.company_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_job_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_company_job_count();

-- Row Level Security (RLS) policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- Public read access for published jobs
CREATE POLICY "Public jobs are viewable by everyone" ON jobs
    FOR SELECT USING (status = 'published');

-- Public read access for companies
CREATE POLICY "Companies are viewable by everyone" ON companies
    FOR SELECT USING (true);

-- Users can save jobs (we'll enhance this with auth later)
CREATE POLICY "Users can manage their saved jobs" ON saved_jobs
    FOR ALL USING (true); -- Will be enhanced with auth

-- Applications policy (basic for now)
CREATE POLICY "Applications are private" ON job_applications
    FOR ALL USING (false); -- Will be enhanced with auth