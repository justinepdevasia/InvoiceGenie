import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Expensa - AI-Powered Expense Document Processing",
    template: "%s | Expensa"
  },
  description: "Transform your expense documents into structured data with AI-powered OCR technology. 99.9% accuracy, 60-second processing, and seamless integrations with QuickBooks and Excel.",
  keywords: ["expense processing", "OCR", "AI document processing", "invoice scanning", "receipt processing", "expense automation", "accounting software", "QuickBooks integration"],
  authors: [{ name: "Expensa" }],
  creator: "Expensa",
  publisher: "Expensa",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://expensa-66al.onrender.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Expensa - AI-Powered Expense Document Processing",
    description: "Transform your expense documents into structured data with AI-powered OCR technology. 99.9% accuracy, 60-second processing, and seamless integrations.",
    url: '/',
    siteName: 'Expensa',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Expensa - AI-Powered Expense Document Processing',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Expensa - AI-Powered Expense Document Processing',
    description: 'Transform your expense documents into structured data with AI-powered OCR technology. 99.9% accuracy in 60 seconds.',
    images: ['/og-image.jpg'],
    creator: '@expensa',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Expensa",
    "description": "AI-powered expense document processing platform that transforms invoices, receipts, and bills into structured data with 99.9% accuracy.",
    "url": "https://expensa-66al.onrender.com",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": [
      {
        "@type": "Offer",
        "name": "Free Plan",
        "price": "0",
        "priceCurrency": "USD",
        "description": "10 pages per month"
      },
      {
        "@type": "Offer",
        "name": "Starter Plan",
        "price": "20",
        "priceCurrency": "USD",
        "billingDuration": "Monthly",
        "description": "300 pages per month"
      },
      {
        "@type": "Offer",
        "name": "Professional Plan",
        "price": "50",
        "priceCurrency": "USD",
        "billingDuration": "Monthly",
        "description": "1000 pages per month"
      }
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "2847"
    },
    "featureList": [
      "AI-powered OCR processing",
      "99.9% accuracy guarantee",
      "60-second processing time",
      "QuickBooks integration",
      "Excel export",
      "Bulk document processing",
      "API access"
    ]
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}