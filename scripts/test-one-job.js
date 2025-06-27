// Simple test to process one real LinkedIn job and insert into database
import { supabaseAdmin } from '../lib/supabase.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function processOneRealJob() {
  console.log('🎯 Processing one real LinkedIn job...')
  
  try {
    // Read sample data
    const dataPath = path.join(__dirname, '../data/SampleData.json')
    const rawData = fs.readFileSync(dataPath, 'utf8')
    const allJobs = JSON.parse(rawData)
    
    // Find a good Rochester job
    const rochesterJobs = allJobs.filter(job => {
      const location = (job.location || '').toLowerCase()
      return location.includes('rochester') || 
             location.includes('brighton') || 
             location.includes('greece') ||
             location.includes('fairport')
    })
    
    // Pick the Assistant Project Manager job (looks promising)
    const sampleJob = rochesterJobs.find(job => 
      job.title?.includes('Assistant Project Manager')
    ) || rochesterJobs[0]
    
    console.log(`\n📋 Processing: ${sampleJob.title} at ${sampleJob.companyName}`)
    console.log(`Location: ${sampleJob.location}`)
    console.log(`Posted: ${sampleJob.postedAt}`)
    
    // Manually clean this job (since Claude API might be slow)
    const cleanedJob = {
      title: sampleJob.title,
      company: sampleJob.companyName,
      location: sampleJob.location,
      description: sampleJob.descriptionText?.replace(/<[^>]*>/g, '') || 'No description available',
      url: sampleJob.link,
      salary_min: null,
      salary_max: null,
      salary_currency: "USD",
      salary_period: "yearly",
      employment_type: sampleJob.employmentType?.toLowerCase() || "full-time",
      remote_ok: false,
      experience_level: sampleJob.seniorityLevel?.toLowerCase()?.replace(' level', '') || "mid",
      skills_required: ["project management", "communication"],
      skills_preferred: ["construction", "engineering", "scheduling"],
      industry: sampleJob.industries || "construction",
      department: "project management",
      benefits: [],
      requirements: ["relevant experience", "strong organizational skills"],
      quality_score: 7,
      source: "linkedin",
      ai_enhanced: true,
      status: "published"
    }
    
    console.log('\n✨ Cleaned job data:')
    console.log(JSON.stringify(cleanedJob, null, 2))
    
    // Insert into database
    console.log('\n💾 Inserting into Supabase...')
    
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .insert([cleanedJob])
      .select()
    
    if (error) {
      console.error('❌ Database error:', error)
      return
    }
    
    console.log('✅ Successfully inserted job!')
    console.log(`Job ID: ${data[0].id}`)
    
    // Test API
    console.log('\n🔍 Testing API...')
    try {
      const response = await fetch('http://localhost:3000/api/jobs?limit=5')
      if (response.ok) {
        const apiData = await response.json()
        console.log(`✅ API returned ${apiData.jobs.length} jobs`)
        
        const ourJob = apiData.jobs.find(job => job.id === data[0].id)
        if (ourJob) {
          console.log('✅ Our processed job is available via API!')
        }
      }
    } catch (fetchError) {
      console.log('⚠️ API test skipped - make sure dev server is running')
    }
    
    console.log('\n🎉 Single job processing test complete!')
    console.log('Ready to process more jobs or set up batch processing.')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

processOneRealJob()