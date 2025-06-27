import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { JobFilters, JobSortOption } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filters from query params
    const filters: JobFilters = {
      search: searchParams.get('search') || undefined,
      location: searchParams.get('location') || undefined,
      employment_type: searchParams.get('employment_type')?.split(',') || undefined,
      remote_ok: searchParams.get('remote_ok') === 'true' || undefined,
      salary_min: searchParams.get('salary_min') ? parseInt(searchParams.get('salary_min')!) : undefined,
      experience_level: searchParams.get('experience_level')?.split(',') || undefined,
      industry: searchParams.get('industry')?.split(',') || undefined,
    }
    
    const sort: JobSortOption = (searchParams.get('sort') as JobSortOption) || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit
    
    // Build query
    let query = supabase
      .from('jobs')
      .select(`
        *,
        companies (
          name,
          slug,
          logo_url,
          website,
          verified
        )
      `)
      .eq('status', 'published')
    
    // Apply filters
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,company.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }
    
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }
    
    if (filters.employment_type && filters.employment_type.length > 0) {
      query = query.in('employment_type', filters.employment_type)
    }
    
    if (filters.remote_ok) {
      query = query.eq('remote_ok', true)
    }
    
    if (filters.salary_min) {
      query = query.gte('salary_min', filters.salary_min)
    }
    
    if (filters.experience_level && filters.experience_level.length > 0) {
      query = query.in('experience_level', filters.experience_level)
    }
    
    if (filters.industry && filters.industry.length > 0) {
      query = query.in('industry', filters.industry)
    }
    
    // Apply sorting
    switch (sort) {
      case 'newest':
        query = query.order('published_at', { ascending: false })
        break
      case 'oldest':
        query = query.order('published_at', { ascending: true })
        break
      case 'salary_high':
        query = query.order('salary_max', { ascending: false, nullsLast: true })
        break
      case 'salary_low':
        query = query.order('salary_min', { ascending: true, nullsLast: true })
        break
      case 'quality_high':
        query = query.order('quality_score', { ascending: false, nullsLast: true })
        break
      case 'company_az':
        query = query.order('company', { ascending: true })
        break
      default:
        query = query.order('published_at', { ascending: false })
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1)
    
    const { data: jobs, error } = await query
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    
    // Get total count for pagination
    const { count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
    
    console.log('Total jobs count:', count)
    
    return NextResponse.json({
      jobs: jobs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page * limit < (count || 0),
        hasPrev: page > 1
      },
      filters,
      sort
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}