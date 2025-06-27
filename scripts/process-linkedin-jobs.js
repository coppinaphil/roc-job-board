// Process LinkedIn jobs with Claude API integration
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function processJobsWithClaude(jobs) {
  const prompt = `You are a job posting processor for RocJobs, a Rochester NY job board. Clean and standardize these LinkedIn job postings.

Raw LinkedIn jobs data:
${JSON.stringify(jobs.slice(0, 3), null, 2)}

Transform these into our database format. Return ONLY a valid JSON array with this structure:

[
  {
    "title": "cleaned job title",
    "company": "company name",
    "location": "Rochester, NY (or specific Rochester suburb)",
    "description": "cleaned description (max 400 words, no HTML)",
    "url": "original LinkedIn URL",
    "salary_min": number_or_null,
    "salary_max": number_or_null,
    "salary_currency": "USD",
    "salary_period": "hourly/yearly",
    "employment_type": "full-time/part-time/contract/internship",
    "remote_ok": boolean,
    "experience_level": "entry/junior/mid/senior/executive",
    "skills_required": ["skill1", "skill2"],
    "skills_preferred": ["skill3", "skill4"],
    "industry": "technology/healthcare/education/finance/retail/etc",
    "department": "engineering/marketing/sales/nursing/etc",
    "benefits": ["benefit1", "benefit2"],
    "requirements": ["requirement1", "requirement2"],
    "quality_score": 1-10,
    "source": "linkedin",
    "ai_enhanced": true,
    "status": "published"
  }
]

Rules:
- ONLY include jobs in greater Rochester NY area (Rochester, Irondequoit, Greece, Brighton, Pittsford, Webster, Penfield, Fairport, Henrietta, Gates, Chili)
- Extract salary from description if salaryInfo is empty
- Quality score: 1-3=poor, 4-6=average, 7-8=good, 9-10=excellent
- Skills from job description and requirements
- Clean HTML formatting and excessive whitespace
- Standardize location names to "City, NY" format
- Skip jobs older than 3 months (before March 2025)
- Focus on legitimate full-time and part-time opportunities
- Extract benefits from description text
- If remote work mentioned, set remote_ok to true`;

  try {
    const response = await window.claude.complete(prompt)
    
    // Extract JSON from response (handle markdown formatting)
    let jsonStr = response
    if (response.includes('```json')) {
      jsonStr = response.split('```json')[1].split('```')[0]
    } else if (response.includes('```')) {
      jsonStr = response.split('```')[1]
    }
    
    const processedJobs = JSON.parse(jsonStr.trim())
    return Array.isArray(processedJobs) ? processedJobs : [processedJobs]
    
  } catch (error) {
    console.error('Error processing jobs with Claude:', error)
    return []
  }
}

async function processLinkedInDataset() {
  try {
    // Read the LinkedIn dataset
    const dataPath = path.join(__dirname, '../../Job-Data(temp folder)/SampleData.json')
    
    console.log('📖 Reading LinkedIn job dataset...')
    const rawData = fs.readFileSync(dataPath, 'utf8')
    const allJobs = JSON.parse(rawData)
    
    console.log(`Found ${allJobs.length} total jobs in dataset`)
    
    // Filter for Rochester area jobs
    const rochesterJobs = allJobs.filter(job => {
      const location = (job.location || '').toLowerCase()
      const rochesterAreas = [
        'rochester', 'irondequoit', 'greece', 'brighton', 'pittsford', 
        'webster', 'penfield', 'fairport', 'henrietta', 'gates', 'chili',
        'brockport', 'spencerport', 'rush', 'churchville'
      ]
      return rochesterAreas.some(area => location.includes(area))
    })
    
    console.log(`Filtered to ${rochesterJobs.length} Rochester area jobs`)
    
    // Process in small batches to avoid overwhelming Claude
    const batchSize = 3 // Small batches for better processing
    const processedJobs = []
    const errors = []
    
    for (let i = 0; i < Math.min(rochesterJobs.length, 30); i += batchSize) { // Limit to first 30 for testing
      const batch = rochesterJobs.slice(i, i + batchSize)
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(Math.min(rochesterJobs.length, 30)/batchSize)}...`)
      
      try {
        const processed = await processJobsWithClaude(batch)
        if (processed && processed.length > 0) {
          processedJobs.push(...processed)
          console.log(`✅ Processed ${processed.length} jobs`)
        } else {
          console.log(`⚠️ No jobs returned from batch`)
        }
      } catch (error) {
        console.error(`❌ Error processing batch:`, error)
        errors.push({ batch: i, error: error.message })
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // Save processed jobs
    const outputPath = path.join(__dirname, '../data/processed-linkedin-jobs.json')
    fs.writeFileSync(outputPath, JSON.stringify(processedJobs, null, 2))
    
    console.log(`\n✅ Processing complete!`)
    console.log(`📊 Results:`)
    console.log(`- Total jobs processed: ${processedJobs.length}`)
    console.log(`- Saved to: ${outputPath}`)
    console.log(`- Errors: ${errors.length}`)
    
    if (processedJobs.length > 0) {
      const avgQuality = processedJobs.reduce((sum, job) => sum + (job.quality_score || 0), 0) / processedJobs.length
      console.log(`- Average quality score: ${avgQuality.toFixed(1)}`)
      
      const highQuality = processedJobs.filter(job => (job.quality_score || 0) >= 7)
      console.log(`- High quality jobs (7+): ${highQuality.length}`)
      
      // Show sample results
      console.log(`\n📋 Sample processed jobs:`)
      processedJobs.slice(0, 3).forEach((job, i) => {
        console.log(`${i + 1}. ${job.title} at ${job.company} - Quality: ${job.quality_score}`)
      })
    }
    
    return processedJobs
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
    return []
  }
}

// Export for use in other scripts
export { processJobsWithClaude, processLinkedInDataset }