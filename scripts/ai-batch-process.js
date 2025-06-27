// AI-powered job processor using local Ollama
import { supabaseAdmin } from '../lib/supabase.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ollama API configuration
const OLLAMA_URL = 'http://localhost:11434'
const MODEL = 'deepseek-r1:1.5b' // DeepSeek R1 - excellent for reasoning and structured tasks

async function processJobWithAI(rawJob) {
  const prompt = `<thinking>
I need to process this LinkedIn job posting for a Rochester NY job board. Let me analyze the raw data and create a clean, professional job posting.

Raw job data:
Title: ${rawJob.title}
Company: ${rawJob.companyName}
Location: ${rawJob.location}
Employment Type: ${rawJob.employmentType}
Description: ${rawJob.descriptionText}
Posted: ${rawJob.postedAt}

I need to:
1. Fix grammar and spelling errors
2. Standardize employment type ("Full-time", "Part-time", "Contract", "Internship")
3. Create a compelling 2-sentence summary (under 120 words)
4. Write a professional description (300-500 words)
5. Extract skills, benefits, and requirements
6. Normalize salary information if present
7. Score the job quality 1-10

Let me work through this systematically.
</thinking>

You are a professional job posting editor. Clean and improve this LinkedIn job posting for a Rochester NY job board.

Return ONLY this JSON structure (no other text):
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
          temperature: 0.1, // Low temperature for consistent formatting
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
    if (aiResponse.includes('```json')) {
      jsonStr = aiResponse.split('```json')[1].split('```')[0]
    } else if (aiResponse.includes('```')) {
      jsonStr = aiResponse.split('```')[1]
    }

    // Clean up any remaining formatting
    jsonStr = jsonStr.trim()
    if (jsonStr.startsWith('json\n')) {
      jsonStr = jsonStr.substring(5)
    }

    const processedJob = JSON.parse(jsonStr)
    
    // Add metadata
    processedJob.source = 'linkedin'
    processedJob.ai_enhanced = true
    processedJob.status = 'published'
    processedJob.url = rawJob.link

    return processedJob

  } catch (error) {
    console.error('AI processing error:', error)
    
    // Fallback to basic processing if AI fails
    return {
      title: rawJob.title || 'Job Opening',
      company: rawJob.companyName || 'Company',
      location: rawJob.location || 'Rochester, NY',
      employment_type: formatEmploymentType(rawJob.employmentType),
      summary: `${rawJob.title} position available at ${rawJob.companyName}. Great opportunity in Rochester area.`,
      description: rawJob.descriptionText?.replace(/<[^>]*>/g, '') || 'Job description not available',
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
      source: 'linkedin',
      ai_enhanced: false,
      status: 'published',
      url: rawJob.link
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

async function batchProcessWithAI(batchSize = 5) {
  console.log('🤖 Starting AI-powered batch job processing...')
  
  // Check Ollama connection
  const ollamaReady = await checkOllamaConnection()
  if (!ollamaReady) {
    console.log('\n🔧 Setup Instructions:')
    console.log('1. Download and install Ollama from https://ollama.ai')
    console.log('2. Run: ollama pull deepseek-r1:1.5b')
    console.log('3. Make sure Ollama is running')
    return
  }
  
  try {
    // Read LinkedIn dataset
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
             location.includes('fairport')
    })
    
    console.log(`📊 Found ${rochesterJobs.length} Rochester area jobs`)
    
    // Process jobs one by one with AI
    const jobsToProcess = rochesterJobs.slice(0, batchSize)
    const processedJobs = []
    const errors = []
    
    console.log(`\n🧠 AI Processing ${jobsToProcess.length} jobs (this may take a few minutes)...\n`)
    
    for (let i = 0; i < jobsToProcess.length; i++) {
      const rawJob = jobsToProcess[i]
      
      try {
        console.log(`🔄 ${i + 1}/${jobsToProcess.length}: Processing "${rawJob.title}" at ${rawJob.companyName}`)
        
        // Check if job already exists
        const { data: existingJob } = await supabaseAdmin
          .from('jobs')
          .select('id')
          .eq('title', rawJob.title)
          .eq('company', rawJob.companyName)
          .eq('source', 'linkedin')
          .single()
        
        if (existingJob) {
          console.log(`   ⏭️  Skipped (already exists)\n`)
          continue
        }
        
        // Process with AI
        const processedJob = await processJobWithAI(rawJob)
        
        // Validate the processed job
        if (processedJob && processedJob.title && processedJob.company) {
          processedJobs.push(processedJob)
          console.log(`   ✅ AI Enhanced (Quality: ${processedJob.quality_score}/10)`)
          console.log(`   📝 Summary: ${processedJob.summary.substring(0, 80)}...`)
          console.log(`   🏷️  Type: ${processedJob.employment_type} | Industry: ${processedJob.industry}\n`)
        } else {
          console.log(`   ❌ AI processing failed, skipping\n`)
          errors.push({ job: rawJob.title, error: 'Invalid AI response' })
        }
        
        // Small delay to be nice to Ollama
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`)
        errors.push({ job: rawJob.title, error: error.message })
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
const batchSize = args[0] ? parseInt(args[0]) : 5

console.log(`🚀 AI Job Processor`)
console.log(`📦 Processing ${batchSize} jobs with ${MODEL}`)
console.log('Usage: node scripts/ai-batch-process.js [batch_size]')
console.log('Example: node scripts/ai-batch-process.js 10\n')

batchProcessWithAI(batchSize)