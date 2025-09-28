'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Sparkles,
  ArrowRight,
  Code,
  Zap,
  Shield,
  Clock,
  ExternalLink
} from 'lucide-react'

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/20 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative">
              <FileText className="h-8 w-8 text-rose-500" />
              <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
              Expensa
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link href="/features">
              <Button variant="ghost">Features</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-rose-500 to-pink-600">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
            <Code className="h-3 w-3 mr-1 inline" />
            Developer Resources
          </Badge>
          <h1 className="text-5xl font-bold mb-4">
            API Documentation
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Integrate Expensa's powerful OCR capabilities into your applications with our RESTful API.
          </p>
        </div>

        {/* Quick Start */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Zap className="h-6 w-6 text-yellow-500" />
              Quick Start
            </CardTitle>
            <CardDescription>
              Get started with the Expensa API in minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">1. Get Your API Key</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Sign up for an account and get your API key from the dashboard.
                </p>
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-rose-500 to-pink-600">
                    Get API Key
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">2. Make Your First Request</h3>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm">
                  <code>
                    curl -X POST https://expensa.dev/api/ocr/process<br/>
                    -H "Authorization: Bearer YOUR_API_KEY"<br/>
                    -H "Content-Type: application/json"<br/>
                    -d '{"file": "base64_encoded_file"}'
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Reference */}
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="authentication">Authentication</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Overview</CardTitle>
                <CardDescription>
                  The Expensa API allows you to process invoices and expense documents programmatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Shield className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Secure</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">API key authentication</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Fast</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Process documents in seconds</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Reliable</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">99.9% uptime SLA</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="authentication" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>
                  All API requests require authentication using an API key
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">API Key Header</h3>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm">
                      <code>Authorization: Bearer YOUR_API_KEY</code>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Getting Your API Key</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      1. Sign up for an Expensa account<br/>
                      2. Go to your dashboard settings<br/>
                      3. Generate a new API key<br/>
                      4. Copy and store it securely
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endpoints" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Endpoints</CardTitle>
                <CardDescription>
                  Available endpoints for document processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-green-100 text-green-700">POST</Badge>
                      <code className="font-mono">/api/ocr/process</code>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      Process a document and extract structured data
                    </p>
                    <h4 className="font-semibold mb-2">Parameters:</h4>
                    <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                      <li><code>file</code> - Base64 encoded file data</li>
                      <li><code>fileName</code> - Original filename</li>
                      <li><code>fileType</code> - MIME type of the file</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-100 text-blue-700">GET</Badge>
                      <code className="font-mono">/api/invoices</code>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Retrieve processed invoices
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Code Examples</CardTitle>
                <CardDescription>
                  Example implementations in popular programming languages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="javascript">
                  <TabsList>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                  </TabsList>

                  <TabsContent value="javascript">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre><code>{`const response = await fetch('https://expensa.dev/api/ocr/process', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    file: base64FileData,
    fileName: 'invoice.pdf',
    fileType: 'application/pdf'
  })
});

const result = await response.json();
console.log(result);`}</code></pre>
                    </div>
                  </TabsContent>

                  <TabsContent value="python">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre><code>{`import requests
import base64

with open('invoice.pdf', 'rb') as f:
    file_data = base64.b64encode(f.read()).decode()

response = requests.post(
    'https://expensa.dev/api/ocr/process',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'file': file_data,
        'fileName': 'invoice.pdf',
        'fileType': 'application/pdf'
    }
)

result = response.json()
print(result)`}</code></pre>
                    </div>
                  </TabsContent>

                  <TabsContent value="curl">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre><code>{`curl -X POST https://expensa.dev/api/ocr/process \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "file": "JVBERi0xLjQKJcOkw7zDtsO8CjIgMCBvYmoKPDwKL0xlbmd0aA==...",
    "fileName": "invoice.pdf",
    "fileType": "application/pdf"
  }'`}</code></pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Support */}
        <Card className="border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Need Help?</CardTitle>
            <CardDescription className="text-lg">
              Our developer support team is here to help you integrate successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  Contact Support
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-rose-500 to-pink-600">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}