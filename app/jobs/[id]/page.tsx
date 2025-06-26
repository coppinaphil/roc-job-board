import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { MapPin, Building2, Clock, DollarSign, Share2, Bookmark, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// Sample job data - in a real app, this would come from a database
const jobs = [
  {
    id: "1",
    title: "Senior Software Engineer",
    company: "Xerox Corporation",
    location: "Rochester, NY",
    type: "Full-time",
    salary: "$85,000 - $120,000",
    posted: "2 days ago",
    description:
      "Join our innovative team developing next-generation printing solutions. We are looking for a passionate software engineer to help build the future of document technology.",
    requirements: [
      "5+ years of software development experience",
      "Proficiency in JavaScript, React, and Node.js",
      "Experience with cloud platforms (AWS, Azure)",
      "Strong problem-solving and communication skills",
      "Bachelor's degree in Computer Science or related field",
    ],
    responsibilities: [
      "Design and develop scalable web applications",
      "Collaborate with cross-functional teams",
      "Mentor junior developers",
      "Participate in code reviews and technical discussions",
      "Contribute to architectural decisions",
    ],
    benefits: [
      "Competitive salary and equity package",
      "Comprehensive health, dental, and vision insurance",
      "401(k) with company matching",
      "Flexible work arrangements",
      "Professional development opportunities",
      "Generous PTO policy",
    ],
    tags: ["JavaScript", "React", "Node.js", "AWS", "Agile"],
    logo: "/placeholder.svg?height=80&width=80",
    companyDescription:
      "Xerox Corporation is a global leader in document technology and services, headquartered in Rochester, NY since 1906.",
    applicationDeadline: "2024-02-15",
    experienceLevel: "Senior Level",
    department: "Engineering",
  },
]

interface PageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const job = jobs.find((j) => j.id === params.id)

  if (!job) {
    return {
      title: "Job Not Found",
    }
  }

  return {
    title: `${job.title} at ${job.company} - Rochester NY Jobs`,
    description: `${job.title} position at ${job.company} in ${job.location}. ${job.description.substring(0, 150)}...`,
    keywords: `${job.title}, ${job.company}, Rochester NY jobs, ${job.tags.join(", ")}`,
    openGraph: {
      title: `${job.title} at ${job.company}`,
      description: job.description,
      type: "article",
    },
  }
}

export default function JobDetailPage({ params }: PageProps) {
  const job = jobs.find((j) => j.id === params.id)

  if (!job) {
    notFound()
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      logo: job.logo,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Rochester",
        addressRegion: "NY",
        addressCountry: "US",
      },
    },
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: {
        "@type": "QuantitativeValue",
        minValue: 85000,
        maxValue: 120000,
        unitText: "YEAR",
      },
    },
    employmentType: job.type.toUpperCase().replace("-", "_"),
    datePosted: "2024-01-20",
    validThrough: job.applicationDeadline,
    experienceRequirements: job.experienceLevel,
    skills: job.tags,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-2">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">RocHire</h1>
                  <p className="text-sm text-gray-600">Rochester, NY</p>
                </div>
              </Link>
              <nav className="hidden md:flex items-center space-x-6">
                <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Browse Jobs
                </Link>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Companies
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Post a Job
                </a>
                <Button variant="outline">Sign In</Button>
              </nav>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={job.logo || "/placeholder.svg"}
                        alt={`${job.company} logo`}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <CardTitle className="text-3xl text-gray-900 mb-2">{job.title}</CardTitle>
                        <CardDescription className="text-xl font-medium text-gray-700">{job.company}</CardDescription>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon">
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-4">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {job.location}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {job.salary}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {job.posted}
                    </div>
                    <Badge variant="secondary">{job.type}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {job.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h3>
                    <p className="text-gray-700 leading-relaxed">{job.description}</p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Responsibilities</h3>
                    <ul className="space-y-2">
                      {job.responsibilities.map((responsibility, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span className="text-gray-700">{responsibility}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h3>
                    <ul className="space-y-2">
                      {job.requirements.map((requirement, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span className="text-gray-700">{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Benefits & Perks</h3>
                    <ul className="space-y-2">
                      {job.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Apply Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Apply for this position</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                    Apply Now
                  </Button>
                  <Button variant="outline" className="w-full">
                    Save Job
                  </Button>
                  <p className="text-sm text-gray-500 text-center">
                    Application deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>

              {/* Company Info */}
              <Card>
                <CardHeader>
                  <CardTitle>About {job.company}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3 mb-4">
                    <img
                      src={job.logo || "/placeholder.svg"}
                      alt={`${job.company} logo`}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <h4 className="font-semibold">{job.company}</h4>
                      <p className="text-sm text-gray-500">{job.department}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">{job.companyDescription}</p>
                  <Button variant="outline" className="w-full">
                    View Company Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Job Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Experience Level</span>
                    <span className="font-medium">{job.experienceLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employment Type</span>
                    <span className="font-medium">{job.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Department</span>
                    <span className="font-medium">{job.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Posted</span>
                    <span className="font-medium">{job.posted}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
