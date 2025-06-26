import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "RocHire - Rochester NY Job Board",
    template: "%s | RochHire",
  },
  description:
    "Find the best job opportunities in Rochester, New York. Browse local positions from top employers in the Flower City.",
  keywords:
    "Rochester NY jobs, Rochester New York employment, local jobs Rochester, careers Rochester NY, job board Rochester",
  authors: [{ name: "RocHire" }],
  creator: "RocHire",
  publisher: "RocHire",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://rochire.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://rochire.com",
    title: "RocHire - Rochester NY Job Board",
    description:
      "Find the best job opportunities in Rochester, New York. Browse local positions from top employers in the Flower City.",
    siteName: "RocHire",
  },
  twitter: {
    card: "summary_large_image",
    title: "RocHire - Rochester NY Job Board",
    description: "Find the best job opportunities in Rochester, New York.",
    creator: "@rochire",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://rocjobs.com" />
        <meta name="geo.region" content="US-NY" />
        <meta name="geo.placename" content="Rochester" />
        <meta name="geo.position" content="43.1566;-77.6088" />
        <meta name="ICBM" content="43.1566, -77.6088" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "RocHire",
              description: "Rochester NY Job Board - Find local employment opportunities",
              url: "https://rochire.com",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://rochire.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
              areaServed: {
                "@type": "City",
                name: "Rochester",
                addressRegion: "NY",
                addressCountry: "US",
              },
            }),
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
