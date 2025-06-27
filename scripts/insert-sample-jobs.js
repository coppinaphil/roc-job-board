import { supabaseAdmin } from '../lib/supabase.js'

// Sample processed job to test our database
const sampleJobs = [
  {
    "title": "Tutors Needed - All Subjects",
    "company": "Grade Potential Tutoring",
    "location": "Irondequoit, NY",
    "description": "Irondequoit families are in immediate need of part-time tutors for all subjects and grade levels. If you live anywhere in the Rochester metro area and are interested in tutoring, we encourage you to apply! We handle all billing and client acquisition, so all you need to think about is how best to help your students. Flexible schedule - we can potentially offer you as many or as few hours and clients as you'd like. Some of our tutors work just a few hours per week, and some work nearly full time. Convenient tutor portal to help keep track of all of your engagements. We generally pay between $20-$30 per hour depending on experience, location, and a few other factors.",
    "url": "https://www.linkedin.com/jobs/view/irondequoit-tutors-needed",
    "salary_min": 20,
    "salary_max": 30,
    "salary_currency": "USD",
    "salary_period": "hourly",
    "employment_type": "part-time",
    "remote_ok": false,
    "experience_level": "entry",
    "skills_required": ["tutoring", "teaching"],
    "skills_preferred": ["math", "reading", "english", "spanish", "french", "chemistry", "physics", "biology"],
    "industry": "education",
    "department": "education",
    "benefits": ["flexible schedule", "billing handled", "tutor portal access"],
    "requirements": ["must not be minor", "passion for helping students"],
    "quality_score": 8,
    "source": "linkedin",
    "ai_enhanced": true,
    "status": "published"
  },
  {
    "title": "Software Engineer",
    "company": "Rochester Tech Co",
    "location": "Rochester, NY",
    "description": "Join our innovative team developing cutting-edge software solutions. Work with modern technologies in a collaborative environment. We offer competitive compensation, excellent benefits, and opportunities for growth.",
    "url": "https://example.com/job/software-engineer",
    "salary_min": 75000,
    "salary_max": 95000,
    "salary_currency": "USD",
    "salary_period": "yearly",
    "employment_type": "full-time",
    "remote_ok": true,
    "experience_level": "mid",
    "skills_required": ["javascript", "react", "node.js", "typescript"],
    "skills_preferred": ["aws", "docker", "kubernetes", "graphql"],
    "industry": "technology",
    "department": "engineering",
    "benefits": ["health insurance", "401k", "remote work", "pto"],
    "requirements": ["3+ years experience", "computer science degree", "problem solving skills"],
    "quality_score": 9,
    "source": "linkedin",
    "ai_enhanced": true,
    "status": "published"
  },
  {
    "title": "Registered Nurse - ICU",
    "company": "Strong Memorial Hospital",
    "location": "Rochester, NY",
    "description": "Seeking experienced ICU nurses to provide exceptional patient care in our state-of-the-art intensive care unit. Join our team of dedicated healthcare professionals committed to improving patient outcomes.",
    "url": "https://example.com/job/rn-icu",
    "salary_min": 70000,
    "salary_max": 85000,
    "salary_currency": "USD",
    "salary_period": "yearly",
    "employment_type": "full-time",
    "remote_ok": false,
    "experience_level": "mid",
    "skills_required": ["nursing", "patient care", "icu experience", "bls certification"],
    "skills_preferred": ["acls", "critical care", "ventilator management", "hemodynamic monitoring"],
    "industry": "healthcare",
    "department": "nursing",
    "benefits": ["health insurance", "retirement plan", "cme allowance", "pto"],
    "requirements": ["rn license", "2+ years icu experience", "bls certification"],
    "quality_score": 9,
    "source": "linkedin",
    "ai_enhanced": true,
    "status": "published"
  }
]

async function insertSampleJobs() {
  try {
    console.log('🚀 Inserting sample jobs into Supabase...')
    
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .insert(sampleJobs)
      .select()
    
    if (error) {
      console.error('❌ Error inserting jobs:', error)
      return
    }
    
    console.log(`✅ Successfully inserted ${data.length} jobs:`)
    data.forEach((job, i) => {
      console.log(`${i + 1}. ${job.title} at ${job.company} (Quality: ${job.quality_score})`)
    })
    
    // Test the API endpoint
    console.log('\n🔍 Testing API endpoint...')
    const response = await fetch('http://localhost:3000/api/jobs')
    const apiData = await response.json()
    
    console.log(`API returned ${apiData.jobs.length} jobs`)
    
  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

// Run the function
insertSampleJobs()