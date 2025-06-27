/**
 * Process LinkedIn job data using Claude API for cleaning and enhancement
 */

const fs = require('fs');
const path = require('path');

// You'll need to add your API key here or use environment variables
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

async function processJobsWithClaude(jobs) {
  const prompt = `You are a job posting processor. Clean and standardize these LinkedIn job postings for a Rochester NY job board.

Transform this raw LinkedIn data into our database format. Focus on Rochester area jobs only.

Raw job data:
${JSON.stringify(jobs, null, 2)}

Return ONLY a JSON array where each job has this exact structure:
[
  {
    "title": "cleaned job title",
    "company": "company name",
    "location": "Rochester, NY (or specific suburb)",
    "description": "cleaned description (max 500 words)",
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
    "industry": "technology/healthcare/education/etc",
    "department": "engineering/marketing/sales/etc",
    "benefits": ["benefit1", "benefit2"],
    "requirements": ["requirement1", "requirement2"],
    "quality_score": 1-10,
    "source": "linkedin",
    "ai_enhanced": true,
    "status": "published"
  }
]

Rules:
- Only include jobs in Rochester NY area (Rochester, Irondequoit, Greece, Brighton, Pittsford, Webster, Penfield, Fairport, etc.)
- Extract salary from description if not in salaryInfo
- Quality score: 1-3=poor, 4-6=average, 7-8=good, 9-10=excellent
- Skills from job description and requirements
- Clean up HTML and formatting issues
- Standardize location names
- Remove jobs older than 6 months`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    const processedJobs = JSON.parse(result.content[0].text);
    return processedJobs;

  } catch (error) {
    console.error('Error processing jobs with Claude:', error);
    return [];
  }
}

async function processJobFile() {
  try {
    // Read the original job data
    const filePath = path.join(__dirname, '../../Job-Data(temp folder)/dataset_linkedin-jobs-scraper_2025-06-27_02-02-31-310.json');
    const rawData = fs.readFileSync(filePath, 'utf8');
    const allJobs = JSON.parse(rawData);
    
    console.log(`Processing ${allJobs.length} jobs...`);
    
    // Filter for Rochester area jobs first
    const rochesterJobs = allJobs.filter(job => {
      const location = job.location?.toLowerCase() || '';
      return location.includes('rochester') || 
             location.includes('irondequoit') || 
             location.includes('greece') || 
             location.includes('brighton') || 
             location.includes('pittsford') || 
             location.includes('webster') || 
             location.includes('penfield') ||
             location.includes('fairport') ||
             location.includes('henrietta') ||
             location.includes('chili') ||
             location.includes('gates');
    });
    
    console.log(`Found ${rochesterJobs.length} Rochester area jobs`);
    
    // Process in batches of 5 jobs at a time (to avoid token limits)
    const batchSize = 5;
    const processedJobs = [];
    
    for (let i = 0; i < rochesterJobs.length; i += batchSize) {
      const batch = rochesterJobs.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(rochesterJobs.length/batchSize)}...`);
      
      const processed = await processJobsWithClaude(batch);
      processedJobs.push(...processed);
      
      // Small delay to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Save processed jobs
    const outputPath = path.join(__dirname, '../data/processed-jobs.json');
    fs.writeFileSync(outputPath, JSON.stringify(processedJobs, null, 2));
    
    console.log(`✅ Processed ${processedJobs.length} jobs saved to ${outputPath}`);
    
    // Generate summary
    const summary = {
      total_processed: processedJobs.length,
      average_quality: processedJobs.reduce((sum, job) => sum + (job.quality_score || 0), 0) / processedJobs.length,
      by_location: {},
      by_industry: {},
      high_quality_jobs: processedJobs.filter(job => (job.quality_score || 0) >= 7).length
    };
    
    processedJobs.forEach(job => {
      summary.by_location[job.location] = (summary.by_location[job.location] || 0) + 1;
      summary.by_industry[job.industry] = (summary.by_industry[job.industry] || 0) + 1;
    });
    
    console.log('\n📊 Processing Summary:');
    console.log(JSON.stringify(summary, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  processJobFile();
}

module.exports = { processJobsWithClaude, processJobFile };