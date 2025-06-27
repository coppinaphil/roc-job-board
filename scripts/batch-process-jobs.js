// Batch process LinkedIn jobs and automatically upload to database
import { supabaseAdmin } from '../lib/supabase.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Simple job processor (manual cleaning for speed)
function processLinkedInJob(rawJob) {
  // Clean and standardize the LinkedIn job data
  const cleanedJob = {
    title: rawJob.title?.trim() || 'Untitled Position',
    company: rawJob.companyName?.trim() || 'Unknown Company',
    location: rawJob.location?.trim() || 'Rochester, NY',
    description: rawJob.descriptionText?.replace(/<[^>]*>/g, '').trim() || 'No description available',
    url: rawJob.link || null,
    
    // Salary extraction (basic logic)
    salary_min: extractSalaryMin(rawJob),
    salary_max: extractSalaryMax(rawJob),
    salary_currency: "USD",
    salary_period: guessSalaryPeriod(rawJob),
    
    // Employment details
    employment_type: (rawJob.employmentType || 'full-time').toLowerCase().replace('-', ''),
    remote_ok: isRemoteJob(rawJob),
    experience_level: mapExperienceLevel(rawJob.seniorityLevel),
    
    // AI-enhanced fields
    skills_required: extractSkills(rawJob, 'required'),
    skills_preferred: extractSkills(rawJob, 'preferred'),
    industry: rawJob.industries || mapIndustry(rawJob),
    department: mapDepartment(rawJob),
    benefits: extractBenefits(rawJob),
    requirements: extractRequirements(rawJob),
    
    // Processing metadata
    quality_score: calculateQualityScore(rawJob),
    source: "linkedin",
    ai_enhanced: true,
    status: "published"
  }
  
  return cleanedJob
}

// Helper functions for data extraction
function extractSalaryMin(job) {
  const text = (job.descriptionText || '') + (job.salaryInfo?.[0] || '')
  const salaryMatch = text.match(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g)
  if (salaryMatch && salaryMatch.length >= 1) {
    return parseInt(salaryMatch[0].replace(/[$,]/g, ''))
  }
  return null
}

function extractSalaryMax(job) {
  const text = (job.descriptionText || '') + (job.salaryInfo?.[0] || '')
  const salaryMatch = text.match(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g)
  if (salaryMatch && salaryMatch.length >= 2) {
    return parseInt(salaryMatch[1].replace(/[$,]/g, ''))
  }
  return null
}

function guessSalaryPeriod(job) {
  const text = (job.descriptionText || '').toLowerCase()
  if (text.includes('/hr') || text.includes('per hour') || text.includes('hourly')) {
    return 'hourly'
  }
  return 'yearly'
}

function isRemoteJob(job) {
  const text = (job.descriptionText || '').toLowerCase()
  return text.includes('remote') || text.includes('work from home') || text.includes('wfh')
}

function mapExperienceLevel(seniorityLevel) {
  if (!seniorityLevel) return 'mid'
  const level = seniorityLevel.toLowerCase()
  if (level.includes('entry') || level.includes('internship')) return 'entry'
  if (level.includes('senior') || level.includes('lead')) return 'senior'
  if (level.includes('executive') || level.includes('director')) return 'executive'
  return 'mid'
}

function extractSkills(job, type = 'required') {
  const text = (job.descriptionText || '').toLowerCase()
  const commonSkills = [
    'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'html', 'css',
    'communication', 'teamwork', 'leadership', 'problem solving', 'analytics',
    'marketing', 'sales', 'customer service', 'project management',
    'nursing', 'patient care', 'medical', 'healthcare',
    'teaching', 'tutoring', 'education', 'training'
  ]
  
  const foundSkills = commonSkills.filter(skill => 
    text.includes(skill) || text.includes(skill.replace('.', ''))
  )
  
  return foundSkills.slice(0, type === 'required' ? 4 : 3)
}

function mapIndustry(job) {
  const industry = job.industries || job.jobFunction || ''
  const text = (job.descriptionText || '').toLowerCase()
  
  if (industry.toLowerCase().includes('healthcare') || text.includes('hospital') || text.includes('nurse')) {
    return 'healthcare'
  }
  if (industry.toLowerCase().includes('education') || text.includes('tutor') || text.includes('teach')) {
    return 'education'
  }
  if (industry.toLowerCase().includes('technology') || text.includes('software') || text.includes('developer')) {
    return 'technology'
  }
  if (text.includes('marketing') || text.includes('sales')) {
    return 'marketing'
  }
  if (text.includes('finance') || text.includes('accounting')) {
    return 'finance'
  }
  
  return industry.toLowerCase() || 'other'
}

function mapDepartment(job) {
  const text = (job.title || '').toLowerCase() + (job.descriptionText || '').toLowerCase()
  
  if (text.includes('engineer') || text.includes('developer') || text.includes('technical')) {
    return 'engineering'
  }
  if (text.includes('marketing') || text.includes('brand')) {
    return 'marketing'
  }
  if (text.includes('sales') || text.includes('account')) {
    return 'sales'
  }
  if (text.includes('nurse') || text.includes('medical') || text.includes('clinical')) {
    return 'nursing'
  }
  if (text.includes('tutor') || text.includes('teacher') || text.includes('education')) {
    return 'education'
  }
  if (text.includes('project') && text.includes('manager')) {
    return 'project management'
  }
  
  return 'general'
}

function extractBenefits(job) {
  const text = (job.descriptionText || '').toLowerCase()
  const benefits = []
  
  if (text.includes('health insurance') || text.includes('medical')) benefits.push('health insurance')
  if (text.includes('401k') || text.includes('retirement')) benefits.push('retirement plan')
  if (text.includes('pto') || text.includes('paid time off') || text.includes('vacation')) benefits.push('pto')
  if (text.includes('remote') || text.includes('work from home')) benefits.push('remote work')
  if (text.includes('flexible')) benefits.push('flexible schedule')
  if (text.includes('dental')) benefits.push('dental insurance')
  if (text.includes('vision')) benefits.push('vision insurance')
  
  return benefits
}

function extractRequirements(job) {
  const text = (job.descriptionText || '').toLowerCase()
  const requirements = []
  
  if (text.includes('bachelor') || text.includes('degree')) requirements.push('bachelor degree')
  if (text.includes('experience')) requirements.push('relevant experience')
  if (text.includes('license')) requirements.push('professional license')
  if (text.includes('certification')) requirements.push('certification required')
  if (text.includes('background check')) requirements.push('background check')
  
  return requirements
}

function calculateQualityScore(job) {
  let score = 5 // Base score
  
  // Add points for good indicators
  if (job.descriptionText && job.descriptionText.length > 200) score += 1
  if (job.salaryInfo && job.salaryInfo[0] && job.salaryInfo[0].length > 0) score += 1
  if (job.companyDescription && job.companyDescription.length > 0) score += 1
  if (job.applicantsCount && parseInt(job.applicantsCount) > 10) score += 1
  if (job.location && job.location.includes('Rochester')) score += 1
  
  // Subtract points for poor indicators
  if (!job.descriptionText || job.descriptionText.length < 100) score -= 2
  if (job.title && job.title.toLowerCase().includes('spam')) score -= 3
  
  return Math.max(1, Math.min(10, score))
}

async function batchProcessJobs(batchSize = 10) {
  console.log('🚀 Starting batch job processing...')
  
  try {
    // Read the LinkedIn dataset
    const dataPath = path.join(__dirname, '../data/SampleData.json')
    const rawData = fs.readFileSync(dataPath, 'utf8')
    const allJobs = JSON.parse(rawData)
    
    // Filter for Rochester area jobs
    const rochesterJobs = allJobs.filter(job => {
      const location = (job.location || '').toLowerCase()
      return location.includes('rochester') || 
             location.includes('irondequoit') || 
             location.includes('greece') || 
             location.includes('brighton') || 
             location.includes('pittsford') || 
             location.includes('webster') || 
             location.includes('penfield') ||
             location.includes('fairport') ||
             location.includes('henrietta') ||
             location.includes('gates') ||
             location.includes('chili')
    })
    
    console.log(`📊 Found ${rochesterJobs.length} Rochester area jobs to process`)
    
    // Process jobs in batches
    const jobsToProcess = rochesterJobs.slice(0, batchSize)
    const processedJobs = []
    const errors = []
    
    console.log(`\n🔄 Processing ${jobsToProcess.length} jobs...`)
    
    for (let i = 0; i < jobsToProcess.length; i++) {
      const rawJob = jobsToProcess[i]
      
      try {
        console.log(`  ${i + 1}/${jobsToProcess.length}: ${rawJob.title} at ${rawJob.companyName}`)
        
        // Check if job already exists
        const { data: existingJob } = await supabaseAdmin
          .from('jobs')
          .select('id')
          .eq('title', rawJob.title)
          .eq('company', rawJob.companyName)
          .eq('source', 'linkedin')
          .single()
        
        if (existingJob) {
          console.log(`    ⏭️  Skipped (already exists)`)
          continue
        }
        
        // Process the job
        const cleanedJob = processLinkedInJob(rawJob)
        processedJobs.push(cleanedJob)
        
        console.log(`    ✅ Processed (Quality: ${cleanedJob.quality_score})`)
        
      } catch (error) {
        console.log(`    ❌ Error: ${error.message}`)
        errors.push({ job: rawJob.title, error: error.message })
      }
    }
    
    // Insert processed jobs into database
    if (processedJobs.length > 0) {
      console.log(`\n💾 Inserting ${processedJobs.length} jobs into database...`)
      
      const { data: insertedJobs, error: insertError } = await supabaseAdmin
        .from('jobs')
        .insert(processedJobs)
        .select()
      
      if (insertError) {
        console.error('❌ Database insertion error:', insertError)
        return
      }
      
      console.log(`✅ Successfully inserted ${insertedJobs.length} jobs!`)
      
      // Generate summary
      const summary = {
        total_processed: processedJobs.length,
        average_quality: processedJobs.reduce((sum, job) => sum + job.quality_score, 0) / processedJobs.length,
        high_quality_jobs: processedJobs.filter(job => job.quality_score >= 7).length,
        industries: {},
        locations: {},
        employment_types: {}
      }
      
      processedJobs.forEach(job => {
        summary.industries[job.industry] = (summary.industries[job.industry] || 0) + 1
        summary.locations[job.location] = (summary.locations[job.location] || 0) + 1
        summary.employment_types[job.employment_type] = (summary.employment_types[job.employment_type] || 0) + 1
      })
      
      console.log('\n📊 Batch Processing Summary:')
      console.log(`   Jobs processed: ${summary.total_processed}`)
      console.log(`   Average quality: ${summary.average_quality.toFixed(1)}`)
      console.log(`   High quality (7+): ${summary.high_quality_jobs}`)
      console.log(`   Errors: ${errors.length}`)
      
      console.log('\n🏢 Industries:')
      Object.entries(summary.industries)
        .sort(([,a], [,b]) => b - a)
        .forEach(([industry, count]) => {
          console.log(`   ${industry}: ${count} jobs`)
        })
      
      console.log('\n📍 Locations:')
      Object.entries(summary.locations)
        .sort(([,a], [,b]) => b - a)
        .forEach(([location, count]) => {
          console.log(`   ${location}: ${count} jobs`)
        })
      
      console.log('\n🎉 Batch processing complete!')
      console.log('🌐 Check your website to see the new jobs!')
      
    } else {
      console.log('\n⚠️ No new jobs to insert (all jobs already exist or failed processing)')
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

// Command line argument parsing
const args = process.argv.slice(2)
const batchSize = args[0] ? parseInt(args[0]) : 10

console.log(`🔄 Running batch processor with batch size: ${batchSize}`)
console.log('Usage: node scripts/batch-process-jobs.js [batch_size]')
console.log('Example: node scripts/batch-process-jobs.js 20\n')

batchProcessJobs(batchSize)