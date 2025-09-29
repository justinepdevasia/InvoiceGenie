'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Image from 'next/image'

export default function DebugPreviewPage() {
  const [invoiceId, setInvoiceId] = useState('5ff72f3e-3823-48e0-9d7d-870dd1582bf8')
  const [user, setUser] = useState<any>(null)
  const [invoice, setInvoice] = useState<any>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const supabase = createClient()

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
    console.log(message)
  }

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        addLog(`Auth error: ${error.message}`)
        setError('Authentication required')
      } else if (user) {
        setUser(user)
        addLog(`User authenticated: ${user.email}`)
      } else {
        addLog('No user found')
        setError('Please log in first')
      }
    } catch (err) {
      addLog(`Auth check failed: ${err}`)
      setError('Authentication check failed')
    }
  }

  async function testPreview() {
    if (!user) {
      setError('Please log in first')
      return
    }

    setLoading(true)
    setError(null)
    setSignedUrl(null)
    setLogs([])

    try {
      addLog(`Starting preview test for invoice: ${invoiceId}`)

      // Step 1: Fetch invoice data
      addLog('Step 1: Fetching invoice from database...')
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('user_id', user.id)
        .single()

      if (invoiceError) {
        throw new Error(`Invoice fetch error: ${invoiceError.message}`)
      }

      if (!invoiceData) {
        throw new Error('Invoice not found')
      }

      setInvoice(invoiceData)
      addLog(`✓ Invoice found: ${invoiceData.original_file_name}`)
      addLog(`  File path: ${invoiceData.file_path}`)
      addLog(`  File type: ${invoiceData.file_type}`)

      if (!invoiceData.file_path) {
        throw new Error('No file path found in invoice record')
      }

      // Step 2: Check if file exists in storage
      addLog('Step 2: Checking if file exists in storage...')
      try {
        const { data: files, error: listError } = await supabase.storage
          .from('documents')
          .list('', {
            search: invoiceData.file_path.split('/').pop() // Get just the filename
          })

        if (listError) {
          addLog(`  List error: ${listError.message}`)
        } else {
          addLog(`  Found ${files?.length || 0} matching files`)
          if (files && files.length > 0) {
            addLog(`  File details: ${JSON.stringify(files[0])}`)
          }
        }
      } catch (listErr) {
        addLog(`  List check failed: ${listErr}`)
      }

      // Step 3: Generate signed URL
      addLog('Step 3: Generating signed URL...')
      const { data: urlData, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(invoiceData.file_path, 3600)

      if (urlError) {
        throw new Error(`Signed URL error: ${urlError.message}`)
      }

      if (!urlData?.signedUrl) {
        throw new Error('No signed URL returned')
      }

      setSignedUrl(urlData.signedUrl)
      addLog(`✓ Signed URL generated: ${urlData.signedUrl.substring(0, 100)}...`)

      // Step 4: Test URL accessibility
      addLog('Step 4: Testing URL accessibility...')
      try {
        const response = await fetch(urlData.signedUrl, { method: 'HEAD' })
        addLog(`  URL test response: ${response.status} ${response.statusText}`)
        if (!response.ok) {
          addLog(`  Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`)
        }
      } catch (fetchErr) {
        addLog(`  URL fetch test failed: ${fetchErr}`)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      addLog(`❌ Error: ${errorMessage}`)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">File Preview Debug Tool</h1>

      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="text-green-600">
              ✓ Authenticated as: {user.email}
            </div>
          ) : (
            <div className="text-red-600">
              ❌ Not authenticated - Please log in first
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Invoice ID:</label>
            <Input
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              placeholder="Enter invoice ID to test"
            />
          </div>
          <Button
            onClick={testPreview}
            disabled={loading || !user}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test File Preview'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-red-600 whitespace-pre-wrap">{error}</pre>
          </CardContent>
        </Card>
      )}

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-64 whitespace-pre-wrap">
              {logs.join('\n')}
            </pre>
          </CardContent>
        </Card>
      )}

      {invoice && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-32">
              {JSON.stringify(invoice, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {signedUrl && (
        <Card>
          <CardHeader>
            <CardTitle>File Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Signed URL:</p>
                <Input value={signedUrl} readOnly className="text-xs" />
              </div>

              {invoice?.file_type?.startsWith('image/') ? (
                <div>
                  <p className="text-sm font-medium mb-2">Image Preview:</p>
                  <div className="border rounded p-4 bg-gray-50">
                    <Image
                      src={signedUrl}
                      alt="Preview"
                      width={400}
                      height={500}
                      className="max-w-full h-auto"
                      onError={(e) => {
                        addLog(`Image load error: ${e}`)
                      }}
                      onLoad={() => {
                        addLog('✓ Image loaded successfully')
                      }}
                    />
                  </div>
                </div>
              ) : invoice?.file_type === 'application/pdf' ? (
                <div>
                  <p className="text-sm font-medium mb-2">PDF Preview:</p>
                  <div className="border rounded">
                    <iframe
                      src={signedUrl}
                      className="w-full h-96"
                      title="PDF Preview"
                      onError={() => {
                        addLog('PDF iframe load error')
                      }}
                      onLoad={() => {
                        addLog('✓ PDF loaded successfully')
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium mb-2">File available but preview not supported for this type</p>
                  <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Open file in new tab
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}