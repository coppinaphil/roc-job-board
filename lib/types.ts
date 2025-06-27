export type Job = {
  id: string
  created_at: string
  updated_at: string
  
  // Basic info
  title: string
  company: string
  location: string | null
  description: string | null
  url: string | null
  
  // Salary
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  salary_period: string
  
  // Employment
  employment_type: string
  remote_ok: boolean
  experience_level: string | null
  education_required: string | null
  
  // AI-enhanced
  skills_required: string[]
  skills_preferred: string[]
  industry: string | null
  department: string | null
  benefits: string[]
  requirements: string[]
  
  // Work details
  work_schedule: string | null
  travel_required: string
  security_clearance: boolean
  
  // Processing
  source: string | null
  quality_score: number | null
  processing_notes: string | null
  ai_enhanced: boolean
  processed_at: string | null
  
  // Publishing
  status: 'draft' | 'published' | 'archived' | 'rejected'
  published_at: string | null
  archived_at: string | null
  
  // Stats
  view_count: number
  application_count: number
  featured: boolean
  expires_at: string | null
  
  // Relations
  company_id: string | null
  suburb: string | null
  companies?: Company
}

export type Company = {
  id: string
  created_at: string
  
  name: string
  slug: string | null
  description: string | null
  website: string | null
  logo_url: string | null
  size_category: string | null
  industry: string | null
  headquarters: string | null
  
  // Social
  linkedin_url: string | null
  twitter_url: string | null
  email: string | null
  
  // Stats
  total_jobs: number
  verified: boolean
}

export type JobApplication = {
  id: string
  created_at: string
  
  job_id: string
  applicant_email: string | null
  applicant_name: string | null
  resume_url: string | null
  cover_letter: string | null
  status: 'pending' | 'reviewed' | 'interviewing' | 'rejected' | 'hired'
  
  source: string | null
  referrer: string | null
}

export type SavedJob = {
  id: string
  created_at: string
  job_id: string
  user_email: string
}

// For inserting new jobs (from AI processing)
export type JobInsert = Omit<Job, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'application_count' | 'companies'>

// Search/filter types
export type JobFilters = {
  search?: string
  location?: string
  employment_type?: string[]
  remote_ok?: boolean
  salary_min?: number
  experience_level?: string[]
  industry?: string[]
}

export type JobSortOption = 
  | 'newest' 
  | 'oldest' 
  | 'salary_high' 
  | 'salary_low' 
  | 'quality_high'
  | 'company_az'