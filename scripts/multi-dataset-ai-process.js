// Function to extract readable location from location object
function extractLocationFromObject(locationObj) {
  if (!locationObj || typeof locationObj !== 'object') return null
  
  // Common location object patterns
  const possibleFields = [
    'name', 'city', 'location', 'address', 'locality', 'region',
    'displayName', 'formatted_address', 'full_address', 'label'
  ]
  
  for (const field of possibleFields) {
    if (locationObj[field] && typeof locationObj[field] === 'string') {
      return locationObj[field]
    }
  }
  
  // If it has city + state, combine them
  if (locationObj.city && locationObj.state) {
    return `${locationObj.city}, ${locationObj.state}`
  }
  
  return null
}

// Extract specific Rochester suburb/town from location
function extractSuburb(location) {
  if (!location || typeof location !== 'string') return 'Rochester'
  
  const loc = location.toLowerCase().trim()
  
  // Rochester suburbs and towns (in priority order)
  const suburbs = [
    { name: 'East Rochester', keywords: ['east rochester'] },
    { name: 'Irondequoit', keywords: ['irondequoit'] },
    { name: 'Greece', keywords: ['greece'] },
    { name: 'Brighton', keywords: ['brighton'] },
    { name: 'Pittsford', keywords: ['pittsford'] },
    { name: 'Webster', keywords: ['webster'] },
    { name: 'Penfield', keywords: ['penfield'] },
    { name: 'Fairport', keywords: ['fairport'] },
    { name: 'Henrietta', keywords: ['henrietta'] },
    { name: 'Gates', keywords: ['gates'] },
    { name: 'Chili', keywords: ['chili', 'town of chili'] },
    { name: 'Victor', keywords: ['victor'] },
    { name: 'Ontario', keywords: ['ontario'] },
    { name: 'Perinton', keywords: ['perinton'] },
    { name: 'Brockport', keywords: ['brockport'] },
    { name: 'Spencerport', keywords: ['spencerport'] },
    { name: 'Churchville', keywords: ['churchville'] },
    { name: 'Scottsville', keywords: ['scottsville'] },
    { name: 'Rush', keywords: ['rush'] },
    { name: 'Mendon', keywords: ['mendon'] },
    { name: 'Hilton', keywords: ['hilton'] }
  ]
  
  // Find matching suburb
  for (const suburb of suburbs) {
    if (suburb.keywords.some(keyword => loc.includes(keyword))) {
      return suburb.name
    }
  }
  
  // Default to Rochester if no specific suburb found
  return 'Rochester'
}// Rochester area validation - strict filtering for Monroe County and immediate suburbs
function isRochesterAreaJob(location) {
  if (!location || typeof location !== 'string') return false
  
  const loc = location.toLowerCase().trim()
  
  // Immediate Rochester area and Monroe County
  const rochesterAreas = [
    'rochester', 'roc ', ' roc', // Rochester proper
    'irondequoit', 'greece', 'brighton', 'pittsford', 
    'webster', 'penfield', 'fairport', 'henrietta',
    'gates', 'chili', 'brockport', 'spencerport',
    'churchville', 'scottsville', 'rush', 'mendon',
    'perinton', 'east rochester', 'hilton', 'victor', 'ontario'
  ]
  
  // Monroe County explicit mentions
  if (loc.includes('monroe county') || loc.includes('monroe co')) {
    return true
  }
  
  // Check for Rochester area matches
  const hasRochesterArea = rochesterAreas.some(area => 
    loc.includes(area)
  )
  
  if (!hasRochesterArea) {
    return false
  }
  
  // EXCLUSIONS - reject these even if they contain "rochester"
  const exclusions = [
    'rochester, mn', 'rochester minnesota', 'rochester, michigan',
    'rochester, nh', 'rochester hills', 'rochester, pa',
    'new hampshire', 'minnesota', 'michigan', 'pennsylvania',
    'remote', 'work from home', 'anywhere', 'nationwide',
    'buffalo', 'syracuse', 'albany', 'new york city', 'nyc',
    'long island', 'westchester', 'brooklyn', 'queens',
    'manhattan', 'bronx', 'staten island'
  ]
  
  const hasExclusion = exclusions.some(exclusion => 
    loc.includes(exclusion)
  )
  
  if (hasExclusion) {
    console.log(`   🚫 Rejected: ${location} (out of area)`)
    return false
  }
  
  // Must explicitly mention NY or New York for Rochester (to avoid other Rochesters)
  // BUT if this is from a Rochester-focused dataset, we can be more lenient
  if (loc.includes('rochester') && 
      !loc.includes('ny') && 
      !loc.includes('new york') && 
      !loc.includes('monroe')) {
    // If it's JUST "Rochester" in a dataset that has other Rochester NY suburbs,
    // we can assume it's Rochester NY
    console.log(`   ⚠️  Accepting ambiguous Rochester (assuming Rochester, NY from context)`)
    return true
  }
  
  return true
}// Multi-dataset AI processor - works with LinkedIn, Indeed, or any job JSON
import { supabaseAdmin } from '../lib/supabase.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ollama API configuration
const OLLAMA_URL = 'http://localhost:11434'
const MODEL = 'qwen3:8b' // Qwen3 8B - excellent for structured outputs and reasoning

async function processJobWithAI(rawJob, datasetType = 'linkedin') {
  // Normalize job data based on dataset type
  const normalizedJob = normalizeJobData(rawJob, datasetType)
  
  const prompt = `You are a professional job posting editor. Clean and improve this job posting for a Rochester NY job board.

Raw job data:
Title: ${normalizedJob.title}
Company: ${normalizedJob.company}
Location: ${normalizedJob.location}
Employment Type: ${normalizedJob.employment_type}
Description: ${normalizedJob.description}
Posted: ${normalizedJob.posted_date}
Source: ${datasetType}

Return ONLY a valid JSON object with this exact structure (no other text):
{
  "title": "cleaned professional job title",
  "company": "company name (cleaned)",
  "location": "Rochester, NY (or specific suburb)",
  "employment_type": "Full-time/Part-time/Contract/Internship",
  "summary": "Compelling 2-sentence summary that makes people want to click (under 120 words)",
  "description": "Well-formatted, professional job description with proper grammar (300-500 words)",
  "salary_min": number_or_null,
  "salary_max": number_or_null,
  "salary_period": "yearly/hourly",
  "remote_ok": boolean,
  "experience_level": "Entry/Mid/Senior/Executive",
  "skills_required": ["skill1", "skill2", "skill3"],
  "skills_preferred": ["skill4", "skill5"],
  "industry": "Technology/Healthcare/Education/Finance/etc",
  "benefits": ["benefit1", "benefit2"],
  "requirements": ["requirement1", "requirement2"],
  "quality_score": 1-10
}

Rules:
- Summary must be exactly 2 sentences, under 120 words
- Fix all grammar and spelling errors
- Use proper capitalization and punctuation
- Make employment_type properly formatted (e.g., "Full-time" not "fulltime")
- Extract realistic salary ranges if mentioned
- Quality score: 8-10 for great jobs, 5-7 for good jobs, 1-4 for poor jobs
- Return ONLY valid JSON, no other text or explanation`

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
          num_predict: 1000
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const result = await response.json()
    const aiResponse = result.response

    // Extract JSON from the AI response
    let jsonStr = aiResponse
    
    // Handle thinking tags (for DeepSeek R1 or similar models)
    if (aiResponse.includes('<think>')) {
      const thinkEnd = aiResponse.lastIndexOf('</think>')
      if (thinkEnd !== -1) {
        jsonStr = aiResponse.substring(thinkEnd + 8).trim()
      }
    }
    
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.split('```json')[1].split('```')[0]
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1]
    }

    // Clean up any remaining formatting
    jsonStr = jsonStr.trim()
    if (jsonStr.startsWith('json\n')) {
      jsonStr = jsonStr.substring(5)
    }

    const processedJob = JSON.parse(jsonStr)
    
    // Clean up numeric fields - convert empty strings to null
    if (processedJob.salary_min === '' || processedJob.salary_min === 'null') {
      processedJob.salary_min = null
    }
    if (processedJob.salary_max === '' || processedJob.salary_max === 'null') {
      processedJob.salary_max = null
    }
    if (processedJob.quality_score === '' || processedJob.quality_score === 'null') {
      processedJob.quality_score = 5
    }
    
    // Add metadata
    processedJob.source = datasetType
    processedJob.ai_enhanced = true
    processedJob.status = 'published'
    processedJob.url = normalizedJob.url
    processedJob.suburb = extractSuburb(normalizedJob.location)

    return processedJob

  } catch (error) {
    console.error('AI processing error:', error)
    
    // Fallback to basic processing if AI fails
    return {
      title: normalizedJob.title || 'Job Opening',
      company: normalizedJob.company || 'Company',
      location: normalizedJob.location || 'Rochester, NY',
      employment_type: formatEmploymentType(normalizedJob.employment_type),
      summary: `${normalizedJob.title} position available at ${normalizedJob.company}. Great opportunity in Rochester area.`,
      description: normalizedJob.description || 'Job description not available',
      salary_min: null,
      salary_max: null,
      salary_period: 'yearly',
      remote_ok: false,
      experience_level: 'Mid',
      skills_required: ['Communication'],
      skills_preferred: [],
      industry: 'General',
      benefits: [],
      requirements: [],
      quality_score: 5,
      source: datasetType,
      ai_enhanced: false,
      status: 'published',
      url: normalizedJob.url,
      suburb: extractSuburb(normalizedJob.location)
    }
  }
}

// Normalize different dataset formats
function normalizeJobData(rawJob, datasetType) {
  if (datasetType === 'linkedin') {
    return {
      title: rawJob.title,
      company: rawJob.companyName,
      location: rawJob.location,
      description: rawJob.descriptionText,
      employment_type: rawJob.employmentType,
      posted_date: rawJob.postedAt,
      url: rawJob.link
    }
  } else if (datasetType === 'indeed') {
    // Handle your Indeed dataset format
    let location = rawJob.location
    
    // Your dataset might have location as an object or different field
    if (typeof location === 'object') {
      location = extractLocationFromObject(location)
    }
    
    // Try other location field names if main one doesn't work
    if (!location) {
      location = rawJob.city || rawJob.formattedLocation || rawJob.locationName
    }
    
    return {
      title: rawJob.title,
      company: rawJob.company || rawJob.companyName || 'Unknown Company',
      location: location,
      description: rawJob.description || rawJob.descriptionHtml?.replace(/<[^>]*>/g, ''),
      employment_type: Array.isArray(rawJob.jobType) ? rawJob.jobType[0] : rawJob.jobType,
      posted_date: rawJob.posted_date || rawJob.datePosted,
      url: rawJob.url || rawJob.link
    }
  } else {
    // Generic format - try common field names and nested locations
    let location = rawJob.location || rawJob.city
    
    // Check for nested location objects
    if (!location && rawJob.formattedLocation) {
      location = rawJob.formattedLocation
    }
    
    // Indeed sometimes has location in different places
    if (!location && rawJob.locationName) {
      location = rawJob.locationName
    }
    
    // Check if it's an object that needs extraction
    if (typeof location === 'object') {
      location = extractLocationFromObject(location)
    }
    
    return {
      title: rawJob.title || rawJob.job_title || rawJob.position,
      company: rawJob.company || rawJob.company_name || rawJob.employer,
      location: location,
      description: rawJob.description || rawJob.job_description || rawJob.summary || rawJob.descriptionHtml,
      employment_type: rawJob.employment_type || rawJob.job_type || rawJob.type || rawJob.jobType?.[0],
      posted_date: rawJob.posted_date || rawJob.date_posted || rawJob.date,
      url: rawJob.url || rawJob.job_url || rawJob.link
    }
  }
}

function formatEmploymentType(type) {
  if (!type) return 'Full-time'
  
  const normalized = type.toLowerCase().replace(/[-\s]/g, '')
  
  switch (normalized) {
    case 'fulltime': return 'Full-time'
    case 'parttime': return 'Part-time'
    case 'contract': return 'Contract'
    case 'internship': return 'Internship'
    case 'temporary': return 'Temporary'
    default: return 'Full-time'
  }
}

async function checkOllamaConnection() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`)
    if (response.ok) {
      const models = await response.json()
      const hasModel = models.models.some(model => model.name.includes(MODEL.split(':')[0]))
      
      if (!hasModel) {
        console.log(`❌ Model ${MODEL} not found. Please run: ollama pull ${MODEL}`)
        return false
      }
      
      console.log(`✅ Ollama is running with ${MODEL}`)
      return true
    }
  } catch (error) {
    console.log('❌ Ollama not running. Please start Ollama and run: ollama pull ' + MODEL)
    return false
  }
  return false
}

async function detectDatasetType(jobs) {
  const sampleJob = jobs[0]
  
  // Check multiple jobs to be sure
  const checkJobs = jobs.slice(0, Math.min(3, jobs.length))
  
  for (const job of checkJobs) {
    // LinkedIn-specific fields
    if (job.companyName && job.descriptionText && job.trackingId) {
      return 'linkedin'
    }
    // Indeed-specific fields - updated for your dataset
    if (job.jobKey || job.jobType || job.descriptionHtml) {
      return 'indeed'
    }
  }
  
  // If unclear, check for common field patterns
  if (sampleJob.company || sampleJob.title) {
    return 'generic'
  }
  
  return 'generic'
}

async function batchProcessWithAI(datasetFile, batchSize = 5) {
  console.log('🤖 Starting AI-powered batch job processing...')
  console.log(`📁 Processing dataset: ${datasetFile}`)
  
  // Check Ollama connection
  const ollamaReady = await checkOllamaConnection()
  if (!ollamaReady) {
    console.log('\n🔧 Setup Instructions:')
    console.log('1. Download and install Ollama from https://ollama.ai')
    console.log('2. Run: ollama pull qwen3:8b')
    console.log('3. Make sure Ollama is running')
    return
  }
  
  try {
    // Read dataset
    const dataPath = path.join(__dirname, '../data', datasetFile)
    
    if (!fs.existsSync(dataPath)) {
      console.log(`❌ Dataset file not found: ${dataPath}`)
      console.log('\n📁 Available datasets:')
      const dataFiles = fs.readdirSync(path.join(__dirname, '../data'))
        .filter(file => file.endsWith('.json'))
      dataFiles.forEach(file => console.log(`   - ${file}`))
      return
    }
    
    const rawData = fs.readFileSync(dataPath, 'utf8')
    const allJobs = JSON.parse(rawData)
    
    console.log(`📊 Dataset contains ${allJobs.length} total jobs`)
    
    // Debug: Show sample job structure
    console.log('\n🔍 Sample job structure:')
    console.log(JSON.stringify(allJobs[0], null, 2).substring(0, 500) + '...')
    
    // Detect dataset type
    const datasetType = await detectDatasetType(allJobs)
    console.log(`📊 Detected dataset type: ${datasetType}`)
    
    // Filter for Rochester area jobs with strict validation
    console.log('\n🗺️ Filtering for Rochester NY area jobs...')
    const rochesterJobs = allJobs.filter(job => {
      const normalizedJob = normalizeJobData(job, datasetType)
      const location = String(normalizedJob.location || '')
      
      const isValid = isRochesterAreaJob(location)
      
      if (isValid) {
        console.log(`   ✅ Accepted: ${location}`)
      }
      
      return isValid
    })
    
    console.log(`📍 Found ${rochesterJobs.length} Rochester area jobs`)
    
    // Process jobs one by one with AI
    const jobsToProcess = rochesterJobs.slice(0, batchSize)
    const processedJobs = []
    const errors = []
    
    console.log(`\n🧠 AI Processing ${jobsToProcess.length} jobs (this may take a few minutes)...\n`)
    
    for (let i = 0; i < jobsToProcess.length; i++) {
      const rawJob = jobsToProcess[i]
      const normalizedJob = normalizeJobData(rawJob, datasetType)
      
      try {
        console.log(`🔄 ${i + 1}/${jobsToProcess.length}: Processing "${normalizedJob.title}" at ${normalizedJob.company}`)
        
        // Check if job already exists
        const { data: existingJob } = await supabaseAdmin
          .from('jobs')
          .select('id')
          .eq('title', normalizedJob.title)
          .eq('company', normalizedJob.company)
          .eq('source', datasetType)
          .single()
        
        if (existingJob) {
          console.log(`   ⏭️  Skipped (already exists)\n`)
          continue
        }
        
        // Process with AI
        const processedJob = await processJobWithAI(rawJob, datasetType)
        
        // Validate the processed job
        if (processedJob && processedJob.title && processedJob.company) {
          processedJobs.push(processedJob)
          console.log(`   ✅ AI Enhanced (Quality: ${processedJob.quality_score}/10)`)
          console.log(`   📝 Summary: ${processedJob.summary.substring(0, 80)}...`)
          console.log(`   🏷️  Type: ${processedJob.employment_type} | Industry: ${processedJob.industry}\n`)
        } else {
          console.log(`   ❌ AI processing failed, skipping\n`)
          errors.push({ job: normalizedJob.title, error: 'Invalid AI response' })
        }
        
        // Small delay to be nice to Ollama
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`)
        errors.push({ job: normalizedJob.title, error: error.message })
      }
    }
    
    // Insert processed jobs into database
    if (processedJobs.length > 0) {
      console.log(`💾 Inserting ${processedJobs.length} AI-enhanced jobs into database...`)
      
      const { data: insertedJobs, error: insertError } = await supabaseAdmin
        .from('jobs')
        .insert(processedJobs)
        .select()
      
      if (insertError) {
        console.error('❌ Database insertion error:', insertError)
        return
      }
      
      console.log(`✅ Successfully inserted ${insertedJobs.length} jobs!\n`)
      
      // Generate detailed summary
      const avgQuality = processedJobs.reduce((sum, job) => sum + job.quality_score, 0) / processedJobs.length
      const highQualityJobs = processedJobs.filter(job => job.quality_score >= 8)
      const aiEnhancedJobs = processedJobs.filter(job => job.ai_enhanced)
      
      console.log('📊 AI Processing Summary:')
      console.log('========================')
      console.log(`✨ Jobs processed: ${processedJobs.length}`)
      console.log(`🤖 AI enhanced: ${aiEnhancedJobs.length}`)
      console.log(`⭐ High quality (8+): ${highQualityJobs.length}`)
      console.log(`📈 Average quality: ${avgQuality.toFixed(1)}/10`)
      console.log(`❌ Errors: ${errors.length}`)
      console.log(`📁 Dataset: ${datasetFile} (${datasetType})`)
      
      console.log('\n🎯 Sample Enhanced Jobs:')
      processedJobs.slice(0, 3).forEach((job, i) => {
        console.log(`${i + 1}. ${job.title} at ${job.company}`)
        console.log(`   Quality: ${job.quality_score}/10 | Type: ${job.employment_type}`)
        console.log(`   Summary: ${job.summary}\n`)
      })
      
      console.log('🎉 AI batch processing complete!')
      console.log('🌐 Check your website to see the enhanced jobs!')
      
    } else {
      console.log('\n⚠️ No new jobs processed (all jobs already exist or failed processing)')
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

// Command line argument parsing
const args = process.argv.slice(2)
const datasetFile = args[0] || 'SampleData.json' // Default to LinkedIn data
const batchSize = args[1] ? parseInt(args[1]) : 5

console.log(`🚀 Multi-Dataset AI Job Processor`)
console.log(`📦 Processing ${batchSize} jobs from ${datasetFile} with ${MODEL}`)
console.log('Usage: node scripts/multi-dataset-ai-process.js [dataset_file] [batch_size]')
console.log('Example: node scripts/multi-dataset-ai-process.js dataset_indeed1.json 10\n')

batchProcessWithAI(datasetFile, batchSize)