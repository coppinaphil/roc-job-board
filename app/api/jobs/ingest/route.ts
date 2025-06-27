import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { JobInsert } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    // Verify the request is coming from GitHub Actions (optional security)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.INGEST_API_TOKEN
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const aiProcessedJobs: JobInsert[] = await request.json()
    
    if (!Array.isArray(aiProcessedJobs)) {
      return NextResponse.json({ error: 'Expected array of jobs' }, { status: 400 })
    }
    
    console.log(`Processing ${aiProcessedJobs.length} AI-enhanced jobs`)
    
    const results = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[]
    }
    
    for (const job of aiProcessedJobs) {
      try {
        // Validate required fields
        if (!job.title || !job.company) {
          results.errors.push(`Missing title or company for job: ${JSON.stringify(job)}`)
          results.skipped++
          continue
        }
        
        // Check if job already exists (by title + company + source)
        const { data: existing } = await supabaseAdmin
          .from('jobs')
          .select('id')
          .eq('title', job.title)
          .eq('company', job.company)
          .eq('source', job.source || 'unknown')
          .single()
        
        if (existing) {
          // Update existing job with AI enhancements
          const { error: updateError } = await supabaseAdmin
            .from('jobs')
            .update({
              ...job,
              ai_enhanced: true,
              processed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
          
          if (updateError) {
            results.errors.push(`Update error: ${updateError.message}`)
            results.skipped++
          } else {
            results.updated++
          }
        } else {
          // Insert new job
          const { error: insertError } = await supabaseAdmin
            .from('jobs')
            .insert({
              ...job,
              ai_enhanced: true,
              processed_at: new Date().toISOString(),
              // Auto-publish high quality jobs
              status: (job.quality_score || 0) >= 7 ? 'published' : 'draft',
              published_at: (job.quality_score || 0) >= 7 ? new Date().toISOString() : null
            })
          
          if (insertError) {
            results.errors.push(`Insert error: ${insertError.message}`)
            results.skipped++
          } else {
            results.inserted++
          }
        }
      } catch (jobError) {
        results.errors.push(`Job processing error: ${jobError}`)
        results.skipped++
      }
    }
    
    console.log('Ingestion results:', results)
    
    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${aiProcessedJobs.length} jobs: ${results.inserted} inserted, ${results.updated} updated, ${results.skipped} skipped`
    })
    
  } catch (error) {
    console.error('Ingestion error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Health check endpoint
  return NextResponse.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    endpoint: 'jobs/ingest'
  })
}