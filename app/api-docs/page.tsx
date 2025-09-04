'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Sparkles, 
  Code, 
  Copy, 
  Check,
  ArrowRight,
  Lock,
  Globe,
  Zap,
  Database,
  Upload,
  Download,
  Search,
  Terminal
} from 'lucide-react'
import Link from 'next/link'

interface CodeBlockProps {
  code: string
  language?: string
}

function CodeBlock({ code, language = 'bash' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <pre className={`bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm`}>
        <code>{code}</code>
      </pre>
      <Button
        size="sm"
        variant="ghost"
        onClick={copyToClipboard}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  )
}

export default function ApiDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('ocr-process')

  const endpoints = [
    {
      id: 'ocr-process',
      method: 'POST',
      path: '/api/ocr/process',
      title: 'Process Invoice with OCR',
      description: 'Extract structured data from invoice documents using AI-powered OCR',
      authentication: 'Bearer Token',
      rateLimit: '100 requests/minute',
      requestBody: {
        invoice_id: 'string (required) - The ID of the uploaded invoice',
        options: {
          extract_line_items: 'boolean - Extract line items (default: true)',
          confidence_threshold: 'number - Minimum confidence score (0-1, default: 0.7)',
          language: 'string - Document language (default: "auto")'
        }
      },
      response: {
        success: true,
        data: {
          invoice_number: 'string',
          invoice_date: 'ISO 8601 date string',
          vendor_name: 'string',
          vendor_address: 'string',
          customer_name: 'string',
          subtotal: 'number',
          tax_amount: 'number',
          total_amount: 'number',
          currency: 'string (ISO 4217)',
          line_items: 'array of objects',
          confidence_score: 'number (0-1)'
        }
      }
    },
    {
      id: 'export-csv',
      method: 'GET',
      path: '/api/export/csv',
      title: 'Export Data to CSV',
      description: 'Export invoice data in CSV format for accounting software',
      authentication: 'Bearer Token',
      rateLimit: '50 requests/minute',
      queryParams: {
        project: 'string - Project ID to export',
        format: 'string - Export format (summary|full|line_items)',
        start_date: 'string - ISO date for filtering',
        end_date: 'string - ISO date for filtering'
      },
      response: 'CSV file download'
    },
    {
      id: 'upload',
      method: 'POST',
      path: '/api/upload',
      title: 'Upload Invoice Document',
      description: 'Upload PDF or image files for processing',
      authentication: 'Bearer Token',
      rateLimit: '50 requests/minute',
      requestBody: {
        file: 'multipart/form-data - PDF, JPG, PNG (max 10MB)',
        project_id: 'string (required) - Target project ID',
        metadata: 'object - Optional metadata'
      },
      response: {
        success: true,
        data: {
          invoice_id: 'string',
          file_url: 'string',
          file_size: 'number',
          page_count: 'number',
          processing_status: 'string'
        }
      }
    },
    {
      id: 'invoices-list',
      method: 'GET',
      path: '/api/invoices',
      title: 'List Invoices',
      description: 'Retrieve a paginated list of invoices',
      authentication: 'Bearer Token',
      rateLimit: '100 requests/minute',
      queryParams: {
        page: 'number - Page number (default: 1)',
        limit: 'number - Items per page (default: 20, max: 100)',
        project_id: 'string - Filter by project',
        status: 'string - Filter by status (pending|processing|completed|failed)',
        sort: 'string - Sort field (created_at|updated_at|total_amount)',
        order: 'string - Sort order (asc|desc)'
      },
      response: {
        success: true,
        data: 'array of invoice objects',
        pagination: {
          current_page: 'number',
          total_pages: 'number',
          total_items: 'number'
        }
      }
    },
    {
      id: 'invoice-get',
      method: 'GET',
      path: '/api/invoices/{id}',
      title: 'Get Invoice Details',
      description: 'Retrieve detailed information about a specific invoice',
      authentication: 'Bearer Token',
      rateLimit: '100 requests/minute',
      pathParams: {
        id: 'string (required) - Invoice ID'
      },
      response: {
        success: true,
        data: {
          id: 'string',
          original_file_name: 'string',
          processing_status: 'string',
          invoice_data: 'object - Extracted data',
          line_items: 'array of objects',
          created_at: 'ISO 8601 timestamp',
          updated_at: 'ISO 8601 timestamp'
        }
      }
    },
    {
      id: 'invoice-update',
      method: 'PATCH',
      path: '/api/invoices/{id}',
      title: 'Update Invoice Data',
      description: 'Manually correct or update extracted invoice data',
      authentication: 'Bearer Token',
      rateLimit: '50 requests/minute',
      pathParams: {
        id: 'string (required) - Invoice ID'
      },
      requestBody: {
        invoice_data: 'object - Fields to update',
        is_verified: 'boolean - Mark as manually verified'
      },
      response: {
        success: true,
        data: 'updated invoice object'
      }
    }
  ]

  const selectedEndpointData = endpoints.find(e => e.id === selectedEndpoint)!

  const exampleCode = {
    'ocr-process': `curl -X POST https://api.invoicegenie.com/api/ocr/process \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "invoice_id": "inv_abc123",
    "options": {
      "extract_line_items": true,
      "confidence_threshold": 0.8
    }
  }'`,
    'export-csv': `curl -X GET "https://api.invoicegenie.com/api/export/csv?project=proj_123&format=summary" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -o invoices.csv`,
    'upload': `curl -X POST https://api.invoicegenie.com/api/upload \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@invoice.pdf" \\
  -F "project_id=proj_123"`,
    'invoices-list': `curl -X GET "https://api.invoicegenie.com/api/invoices?page=1&limit=20" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    'invoice-get': `curl -X GET https://api.invoicegenie.com/api/invoices/inv_abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    'invoice-update': `curl -X PATCH https://api.invoicegenie.com/api/invoices/inv_abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "invoice_data": {
      "total_amount": 1250.00,
      "tax_amount": 125.00
    },
    "is_verified": true
  }'`
  }

  const pythonExample = `import requests
import json

# Initialize with your API key
api_key = "YOUR_API_KEY"
base_url = "https://api.invoicegenie.com"

# Upload an invoice
with open("invoice.pdf", "rb") as file:
    response = requests.post(
        f"{base_url}/api/upload",
        headers={"Authorization": f"Bearer {api_key}"},
        files={"file": file},
        data={"project_id": "proj_123"}
    )
    invoice = response.json()

# Process with OCR
ocr_response = requests.post(
    f"{base_url}/api/ocr/process",
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    },
    json={
        "invoice_id": invoice["data"]["invoice_id"],
        "options": {"extract_line_items": True}
    }
)

# Export to CSV
export_response = requests.get(
    f"{base_url}/api/export/csv",
    headers={"Authorization": f"Bearer {api_key}"},
    params={"project": "proj_123", "format": "summary"}
)

# Save CSV file
with open("invoices.csv", "wb") as f:
    f.write(export_response.content)`

  const nodeExample = `const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Initialize with your API key
const apiKey = 'YOUR_API_KEY';
const baseUrl = 'https://api.invoicegenie.com';

// Upload an invoice
async function uploadInvoice(filePath, projectId) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('project_id', projectId);

  const response = await axios.post(\`\${baseUrl}/api/upload\`, form, {
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
      ...form.getHeaders()
    }
  });
  
  return response.data;
}

// Process with OCR
async function processInvoice(invoiceId) {
  const response = await axios.post(
    \`\${baseUrl}/api/ocr/process\`,
    {
      invoice_id: invoiceId,
      options: {
        extract_line_items: true,
        confidence_threshold: 0.8
      }
    },
    {
      headers: {
        'Authorization': \`Bearer \${apiKey}\`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
}

// Usage
(async () => {
  try {
    const upload = await uploadInvoice('./invoice.pdf', 'proj_123');
    const result = await processInvoice(upload.data.invoice_id);
    console.log('Extracted data:', result.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
})();`

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative">
                <FileText className="h-8 w-8 text-rose-500" />
                <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
              </div>
              <span className="font-bold text-2xl bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
                Invoice Genie
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="hover:text-rose-500 transition-colors">
                Dashboard
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all">
                Get API Key
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
            <Code className="h-3 w-3 mr-1 inline" />
            REST API v1.0
          </Badge>
          <h1 className="text-5xl font-bold mb-4">
            API Documentation
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Integrate Invoice Genie's powerful OCR capabilities into your applications with our RESTful API
          </p>
        </div>

        {/* Quick Start */}
        <Card className="mb-8 border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-rose-500" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">Get Your API Key</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sign up and access your API key from the dashboard
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">Authenticate Requests</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Include your API key in the Authorization header
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">Start Processing</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upload and process invoices with simple API calls
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-sm font-semibold mb-2">Base URL:</p>
              <CodeBlock code="https://api.invoicegenie.com" language="text" />
            </div>
          </CardContent>
        </Card>

        {/* API Reference */}
        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1">
                  {endpoints.map((endpoint) => (
                    <button
                      key={endpoint.id}
                      onClick={() => setSelectedEndpoint(endpoint.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                        selectedEndpoint === endpoint.id
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{endpoint.title}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {endpoint.method}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 space-y-6">
            {/* Endpoint Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedEndpointData.title}</CardTitle>
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    {selectedEndpointData.method}
                  </Badge>
                </div>
                <CardDescription>{selectedEndpointData.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Endpoint URL */}
                <div>
                  <h3 className="font-semibold mb-2">Endpoint</h3>
                  <CodeBlock code={selectedEndpointData.path} language="text" />
                </div>

                {/* Authentication */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Authentication
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedEndpointData.authentication}
                  </p>
                  <CodeBlock code="Authorization: Bearer YOUR_API_KEY" language="text" />
                </div>

                {/* Rate Limiting */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Rate Limit
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedEndpointData.rateLimit}
                  </p>
                </div>

                {/* Request Parameters */}
                {(selectedEndpointData.requestBody || selectedEndpointData.queryParams || selectedEndpointData.pathParams) && (
                  <div>
                    <h3 className="font-semibold mb-2">Request Parameters</h3>
                    <div className="space-y-3">
                      {selectedEndpointData.pathParams && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Path Parameters:</p>
                          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                            {Object.entries(selectedEndpointData.pathParams).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <code className="text-rose-600">{key}</code>: {value}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedEndpointData.queryParams && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Query Parameters:</p>
                          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-1">
                            {Object.entries(selectedEndpointData.queryParams).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <code className="text-rose-600">{key}</code>: {value}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedEndpointData.requestBody && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Request Body:</p>
                          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-1">
                            {Object.entries(selectedEndpointData.requestBody).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <code className="text-rose-600">{key}</code>: {
                                  typeof value === 'object' 
                                    ? <div className="ml-4 mt-1">
                                        {Object.entries(value).map(([subKey, subValue]) => (
                                          <div key={subKey}>
                                            <code className="text-blue-600">{subKey}</code>: {subValue}
                                          </div>
                                        ))}
                                      </div>
                                    : value
                                }
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Response */}
                <div>
                  <h3 className="font-semibold mb-2">Response</h3>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <pre className="text-sm overflow-x-auto">
                      <code>{JSON.stringify(selectedEndpointData.response, null, 2)}</code>
                    </pre>
                  </div>
                </div>

                {/* Example */}
                <div>
                  <h3 className="font-semibold mb-2">Example Request</h3>
                  <CodeBlock code={exampleCode[selectedEndpoint as keyof typeof exampleCode]} />
                </div>
              </CardContent>
            </Card>

            {/* Code Examples */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Code Examples
                </CardTitle>
                <CardDescription>
                  Complete examples in popular programming languages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="python" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="nodejs">Node.js</TabsTrigger>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                  </TabsList>
                  <TabsContent value="python" className="mt-4">
                    <CodeBlock code={pythonExample} language="python" />
                  </TabsContent>
                  <TabsContent value="nodejs" className="mt-4">
                    <CodeBlock code={nodeExample} language="javascript" />
                  </TabsContent>
                  <TabsContent value="curl" className="mt-4">
                    <CodeBlock code={exampleCode['ocr-process']} language="bash" />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Status Codes */}
            <Card>
              <CardHeader>
                <CardTitle>Response Status Codes</CardTitle>
                <CardDescription>
                  Standard HTTP status codes are used to indicate success or failure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-100 text-green-700 border-green-200">200</Badge>
                      <span className="font-medium">OK</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Request successful</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-100 text-green-700 border-green-200">201</Badge>
                      <span className="font-medium">Created</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Resource created successfully</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">400</Badge>
                      <span className="font-medium">Bad Request</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Invalid request parameters</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200">401</Badge>
                      <span className="font-medium">Unauthorized</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Missing or invalid API key</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200">403</Badge>
                      <span className="font-medium">Forbidden</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Access denied to resource</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-red-100 text-red-700 border-red-200">404</Badge>
                      <span className="font-medium">Not Found</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Resource not found</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">429</Badge>
                      <span className="font-medium">Too Many Requests</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Rate limit exceeded</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-red-100 text-red-700 border-red-200">500</Badge>
                      <span className="font-medium">Internal Server Error</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Server error, try again later</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SDKs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  SDKs & Libraries
                </CardTitle>
                <CardDescription>
                  Official and community SDKs for easy integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Python SDK</h3>
                      <Badge>Official</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Full-featured Python client library
                    </p>
                    <CodeBlock code="pip install invoice-genie" language="bash" />
                  </div>
                  <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Node.js SDK</h3>
                      <Badge>Official</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      TypeScript-ready Node.js client
                    </p>
                    <CodeBlock code="npm install @invoice-genie/sdk" language="bash" />
                  </div>
                  <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">PHP SDK</h3>
                      <Badge variant="outline">Community</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Community-maintained PHP library
                    </p>
                    <CodeBlock code="composer require invoice-genie/php-sdk" language="bash" />
                  </div>
                  <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Ruby SDK</h3>
                      <Badge variant="outline">Community</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Ruby gem for Invoice Genie API
                    </p>
                    <CodeBlock code="gem install invoice_genie" language="bash" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Webhooks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Webhooks
                </CardTitle>
                <CardDescription>
                  Receive real-time notifications when events occur
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure webhook endpoints in your dashboard to receive notifications for:
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">invoice.processed</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Fired when OCR processing completes
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">invoice.updated</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Fired when invoice data is modified
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">export.completed</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Fired when bulk export finishes
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">quota.exceeded</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Fired when usage limit is reached
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Webhook Payload Example:</p>
                  <CodeBlock code={`{
  "event": "invoice.processed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "invoice_id": "inv_abc123",
    "status": "completed",
    "confidence_score": 0.95,
    "page_count": 3,
    "total_amount": 1250.00,
    "currency": "USD"
  }
}`} language="json" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="container mx-auto px-4 py-12">
        <Card className="border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Ready to integrate?</CardTitle>
            <CardDescription className="text-lg">
              Get your API key and start processing invoices in minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white">
                  Get API Key
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="https://github.com/invoice-genie/examples" target="_blank">
                <Button size="lg" variant="outline">
                  View Examples
                  <Code className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              Free tier includes 10 pages/month • No credit card required
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}