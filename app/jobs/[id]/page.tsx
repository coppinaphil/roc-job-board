import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Building2, Clock, User, ArrowLeft, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from 'next/link'

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

async function getJob(id: string) {
  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      *,
      companies (
        name,
        logo_url,
        website,
        verified,
        description
      )
    `)
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (error || !job) {
    return null
  }

  return job
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const job = await getJob(params.id)

  if (!job) {
    notFound()
  }

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
                <Link href="/">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                RocJobs
                </h1>
                </Link>
                <p className="text-sm text-gray-500 font-medium">The Flower City&apos;s Job Hub</p>
              </div>
            </div>
            
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Jobs
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Job Detail Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Job Header */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-2xl">
                      {job.companies?.name?.[0] || job.company[0]}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-3xl text-gray-900">
                        {job.title}
                      </CardTitle>
                      {job.ai_enhanced && (
                        <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                          🤖 AI Enhanced
                        </Badge>
                      )}
                      {job.quality_score && job.quality_score >= 8 && (
                        <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                          ⭐ High Quality
                        </Badge>
                      )}
                    </div>
                    <p className="text-xl font-medium text-gray-700 mb-2">
                      {job.companies?.name || job.company}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.location}
                      </div>
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-1" />
                        {job.employment_type}
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {job.experience_level}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Posted {formatPostedDate(job.published_at || job.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {formatSalary(job)}
                  </div>
                  {job.remote_ok && (
                    <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                      🏠 Remote OK
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Summary */}
              {job.summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Job Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 text-lg leading-relaxed">
                      {job.summary}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Job Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {job.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {job.requirements.map((requirement: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span className="text-gray-700">{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Benefits */}
              {job.benefits && job.benefits.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {job.benefits.map((benefit: string, index: number) => (
                        <div key={index} className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          <span className="text-gray-700 capitalize">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Apply Button */}
              <Card>
                <CardContent className="p-6">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-3"
                    asChild
                  >
                    <a href={job.url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                      Apply Now
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  
                  <p className="text-sm text-gray-500 text-center mt-3">
                    You&apos;ll be redirected to the original job posting
                  </p>
                </CardContent>
              </Card>

              {/* Skills */}
              {((job.skills_required && job.skills_required.length > 0) || 
                (job.skills_preferred && job.skills_preferred.length > 0)) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Skills</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {job.skills_required && job.skills_required.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Required</h4>
                        <div className="flex flex-wrap gap-2">
                          {job.skills_required.map((skill: string, index: number) => (
                            <Badge key={index} variant="default" className="capitalize">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {job.skills_preferred && job.skills_preferred.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Preferred</h4>
                        <div className="flex flex-wrap gap-2">
                          {job.skills_preferred.map((skill: string, index: number) => (
                            <Badge key={index} variant="outline" className="capitalize">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Job Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Industry</span>
                    <span className="font-medium capitalize">{job.industry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Department</span>
                    <span className="font-medium capitalize">{job.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Experience Level</span>
                    <span className="font-medium">{job.experience_level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employment Type</span>
                    <span className="font-medium">{job.employment_type}</span>
                  </div>
                  {job.quality_score && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quality Score</span>
                      <span className="font-medium">{job.quality_score}/10</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Company Info */}
              {job.companies && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">About {job.companies.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {job.companies.description && (
                      <p className="text-gray-700 mb-3">{job.companies.description}</p>
                    )}
                    
                    {job.companies.website && (
                      <Button variant="outline" className="w-full" asChild>
                        <a href={job.companies.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                          Visit Website
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}