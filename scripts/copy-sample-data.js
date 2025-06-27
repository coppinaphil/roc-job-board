// Quick script to copy and test LinkedIn data processing
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('📁 Copying LinkedIn sample data to project...')

// Copy the file to a more convenient location
const sourcePath = path.join(__dirname, '../../Job-Data(temp folder)/SampleData.json')
const destPath = path.join(__dirname, '../data/SampleData.json')

try {
  const data = fs.readFileSync(sourcePath, 'utf8')
  fs.writeFileSync(destPath, data)
  
  console.log(`✅ Copied SampleData.json to data/ folder`)
  
  // Quick analysis
  const jobs = JSON.parse(data)
  console.log(`📊 Dataset contains ${jobs.length} total jobs`)
  
  // Filter for Rochester
  const rochesterJobs = jobs.filter(job => {
    const location = (job.location || '').toLowerCase()
    return location.includes('rochester') || 
           location.includes('irondequoit') || 
           location.includes('greece') || 
           location.includes('brighton') || 
           location.includes('pittsford') || 
           location.includes('webster') || 
           location.includes('penfield') ||
           location.includes('fairport')
  })
  
  console.log(`🎯 Found ${rochesterJobs.length} Rochester area jobs`)
  
  // Show sample titles
  console.log('\n📋 Sample Rochester job titles:')
  rochesterJobs.slice(0, 10).forEach((job, i) => {
    console.log(`${i + 1}. ${job.title} at ${job.companyName} (${job.location})`)
  })
  
} catch (error) {
  console.error('❌ Error:', error.message)
}