import type { Metadata } from "next"
import { Search, MapPin, Building2, Clock, DollarSign, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from 'next/link'
import { supabase } from "@/lib/supabase"


export const metadata: Metadata = {
  title: "Rochester NY Jobs | Find Local Employment Opportunities",
  description:
    "Discover the best job opportunities in Rochester, New York. Browse local positions from top employers in the Flower City. Updated daily.",
  keywords: "Rochester NY jobs, Rochester New York employment, local jobs Rochester, careers Rochester NY",
  openGraph: {
    title: "Rochester NY Jobs - Local Employment Opportunities",
    description: "Find your next career opportunity in Rochester, New York",
    type: "website",
  },
}



// Helper function to format salary
function formatSalary(job: { salary_min?: number; salary_max?: number; salary_period?: string }) {
  if (!job.salary_min && !job.salary_max) return "Salary not specified"
  
  const formatAmount = (amount: number) => {
    if (job.salary_period === 'hourly') {
      return `$${amount}/hr`
    }
    return `$${amount.toLocaleString()}`
  }
  
  if (job.salary_min && job.salary_max) {
    return `${formatAmount(job.salary_min)} - ${formatAmount(job.salary_max)}`
  } else if (job.salary_min) {
    return `${formatAmount(job.salary_min)}+`
  } else if (job.salary_max) {
    return `Up to ${formatAmount(job.salary_max)}`
  }
  
  return "Salary not specified"
}

// Helper function to format posted date
function formatPostedDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

// Server component to fetch jobs
async function getJobs() {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(`
      *,
      companies (
        name,
        logo_url,
        verified
      )
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching jobs:', error)
    return []
  }

  return jobs || []
}

export default async function HomePage() {
  const jobs = await getJobs()
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">R</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">+</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  RocJobs
                </h1>
                <p className="text-sm text-gray-500 font-medium">The Flower City&apos;s Job Hub</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Browse Jobs
              </a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Companies
              </a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Post a Job
              </a>
              <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                Sign In
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Get Started
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="absolute inset-0 opacity-30">
            <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Rochester Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-blue-100">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Live in Rochester, NY</span>
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
                <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
              </div>
            </div>

            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Your Next Career
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">
                Blooms Here
              </span>
            </h2>

            <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
              From tech startups to established giants, discover opportunities that match your ambitions in
              <span className="font-semibold text-gray-800"> Rochester&apos;s thriving job market</span>.
            </p>

            {/* Dynamic Stats */}
            <div className="flex justify-center space-x-8 mb-12">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{jobs.length}+</div>
                <div className="text-sm text-gray-500">Active Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{new Set(jobs.map(job => job.company)).size}+</div>
                <div className="text-sm text-gray-500">Companies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{jobs.filter(job => job.ai_enhanced).length}</div>
                <div className="text-sm text-gray-500">AI Enhanced</div>
              </div>
            </div>

            {/* Enhanced Search Bar */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                  <div className="md:col-span-5 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Search jobs, companies, or skills..."
                      className="pl-12 h-12 border-0 text-base placeholder:text-gray-400 focus-visible:ring-0"
                    />
                  </div>
                  <div className="md:col-span-4 relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Rochester, NY"
                      className="pl-12 h-12 border-0 text-base placeholder:text-gray-400 focus-visible:ring-0"
                      defaultValue="Rochester, NY"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base font-semibold rounded-xl">
                      Find Jobs
                    </Button>
                  </div>
                </div>
              </div>

              {/* Popular Skills from Real Data */}
              {Array.from(new Set(jobs.flatMap(job => job.skills_required || []))).length > 0 && (
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <span className="text-sm text-gray-500">Popular:</span>
                  {Array.from(new Set(jobs.flatMap(job => job.skills_required || []))).slice(0, 5).map((skill) => (
                    <div
                      key={skill}
                      className="text-sm bg-white/60 hover:bg-white border border-gray-200 rounded-full px-3 py-1 text-gray-700 hover:text-blue-600 transition-colors capitalize cursor-pointer"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-100 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-purple-100 rounded-full opacity-40 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-orange-100 rounded-full opacity-50 animate-pulse delay-500"></div>
      </section>

      {/* Filters and Job Listings */}
      <main className="container mx-auto px-4 py-12">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rochester Area</SelectItem>
              {Array.from(new Set(jobs.map(job => job.suburb).filter(Boolean))).sort().map((suburb) => (
                <SelectItem key={suburb} value={suburb!}>{suburb}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full-time">Full-time</SelectItem>
              <SelectItem value="part-time">Part-time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              {Array.from(new Set(jobs.map(job => job.industry).filter(Boolean))).map((industry) => (
                <SelectItem key={industry} value={industry!}>{industry}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Experience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entry">Entry Level</SelectItem>
              <SelectItem value="mid">Mid Level</SelectItem>
              <SelectItem value="senior">Senior Level</SelectItem>
              <SelectItem value="executive">Executive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-900">{jobs.length} Jobs in Rochester, NY</h3>
          <div className="flex items-center gap-2">
            {jobs.filter(job => job.ai_enhanced).length > 0 && (
              <Badge variant="outline" className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                🤖 AI Enhanced
              </Badge>
            )}
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" defaultValue="newest" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="quality">Quality Score</SelectItem>
                <SelectItem value="salary-high">Salary: High to Low</SelectItem>
                <SelectItem value="company">Company A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Job Listings */}
        <div className="grid gap-6">
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No jobs found. Run the batch processor to add jobs!</p>
              <Link href="/admin">
                <Button className="mt-4">
                  Add Jobs
                </Button>
              </Link>
            </div>
          ) : (
            jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {job.companies?.name?.[0] || job.company[0]}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl text-gray-900 hover:text-blue-600 transition-colors">
                              {job.title}
                            </CardTitle>
                            {job.ai_enhanced && (
                              <Badge variant="outline" className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                                🤖 AI Enhanced
                              </Badge>
                            )}
                            {job.quality_score && job.quality_score >= 8 && (
                              <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                                ⭐ High Quality
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-lg font-medium text-gray-700">
                            {job.companies?.name || job.company}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-sm capitalize">
                        {job.employment_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {job.summary || job.description?.substring(0, 120) + '...' || 'No description available'}
                    </p>

                    {/* Skills Tags */}
                    {job.skills_required && job.skills_required.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.skills_required.slice(0, 6).map((skill: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs capitalize">
                            {skill}
                          </Badge>
                        ))}
                        {job.skills_required.length > 6 && (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            +{job.skills_required.length - 6} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.suburb && job.suburb !== 'Rochester' ? `${job.suburb}, NY` : job.location}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {formatSalary(job)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatPostedDate(job.published_at || job.created_at)}
                      </div>
                      {job.remote_ok && (
                        <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                          🏠 Remote OK
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        {/* Load More */}
        {jobs.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Jobs
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold">RocJobs</span>
              </div>
              <p className="text-gray-600">Connecting talent with opportunity in Rochester, NY.</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">For Job Seekers</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Browse Jobs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Career Advice
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Resume Builder
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Salary Guide
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">For Employers</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Post a Job
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Browse Resumes
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Employer Resources
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">About Rochester</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Living in Rochester
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Top Employers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Industry Insights
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Local Events
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 mt-8 text-center text-gray-600">
            <p>&copy; 2024 RocJobs. All rights reserved. | Privacy Policy | Terms of Service</p>
          </div>
        </div>
      </footer>
    </div>
  )
}