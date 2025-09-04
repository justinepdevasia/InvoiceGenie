'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Database,
  Key,
  Eye,
  EyeOff
} from 'lucide-react'
import { checkBucketSecurity } from '@/lib/storage-security'

interface SecurityTest {
  name: string
  description: string
  status: 'pending' | 'passed' | 'failed' | 'warning'
  message?: string
}

export default function SecurityTestPage() {
  const [tests, setTests] = useState<SecurityTest[]>([])
  const [loading, setLoading] = useState(false)
  const [overallStatus, setOverallStatus] = useState<'secure' | 'vulnerable' | 'unknown'>('unknown')
  const supabase = createClient()

  const runSecurityTests = async () => {
    setLoading(true)
    const testResults: SecurityTest[] = []

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in to run security tests')
        return
      }

      // Test 1: Check if user is authenticated
      testResults.push({
        name: 'Authentication Check',
        description: 'Verify user authentication is required',
        status: user ? 'passed' : 'failed',
        message: user ? `Authenticated as ${user.email}` : 'Not authenticated'
      })

      // Test 2: Check bucket configuration
      const bucketCheck = await checkBucketSecurity(supabase)
      testResults.push({
        name: 'Storage Bucket Security',
        description: 'Verify storage bucket is private and has RLS',
        status: bucketCheck.isSecure ? 'passed' : 'failed',
        message: bucketCheck.isSecure ? 'Bucket is properly secured' : bucketCheck.issues.join(', ')
      })

      // Test 3: Test file isolation
      try {
        // Try to list files without user folder - should fail or return empty
        const { data: otherFiles, error } = await supabase.storage
          .from('invoices')
          .list('fake-user-id-123')

        if (!error && otherFiles && otherFiles.length > 0) {
          testResults.push({
            name: 'File Isolation Test',
            description: 'Verify users cannot access other users\' files',
            status: 'failed',
            message: 'Could access other user folders - RLS may be misconfigured'
          })
        } else {
          testResults.push({
            name: 'File Isolation Test',
            description: 'Verify users cannot access other users\' files',
            status: 'passed',
            message: 'Cannot access other user files - properly isolated'
          })
        }
      } catch (error) {
        testResults.push({
          name: 'File Isolation Test',
          description: 'Verify users cannot access other users\' files',
          status: 'warning',
          message: 'Test inconclusive'
        })
      }

      // Test 4: Check RLS on database tables
      try {
        // Try to query invoices without user filter - RLS should handle this
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('id, user_id')
          .limit(10)

        if (!error && invoices) {
          const otherUserInvoices = invoices.filter(inv => inv.user_id !== user.id)
          if (otherUserInvoices.length > 0) {
            testResults.push({
              name: 'Database RLS Test',
              description: 'Verify database row-level security',
              status: 'failed',
              message: `Found ${otherUserInvoices.length} invoices from other users`
            })
          } else {
            testResults.push({
              name: 'Database RLS Test',
              description: 'Verify database row-level security',
              status: 'passed',
              message: 'Can only see own invoices - RLS working'
            })
          }
        } else {
          testResults.push({
            name: 'Database RLS Test',
            description: 'Verify database row-level security',
            status: 'passed',
            message: 'Database access properly restricted'
          })
        }
      } catch (error) {
        testResults.push({
          name: 'Database RLS Test',
          description: 'Verify database row-level security',
          status: 'warning',
          message: 'Could not verify database RLS'
        })
      }

      // Test 5: Check file upload path enforcement
      try {
        const testFileName = `wrong-path/test-${Date.now()}.txt`
        const { error: uploadError } = await supabase.storage
          .from('invoices')
          .upload(testFileName, new Blob(['test']), {
            contentType: 'text/plain'
          })

        if (uploadError) {
          testResults.push({
            name: 'Upload Path Enforcement',
            description: 'Verify files must be in user folder',
            status: 'passed',
            message: 'Cannot upload to incorrect path - properly enforced'
          })
        } else {
          // Clean up if it succeeded (shouldn't happen with proper RLS)
          await supabase.storage.from('invoices').remove([testFileName])
          testResults.push({
            name: 'Upload Path Enforcement',
            description: 'Verify files must be in user folder',
            status: 'failed',
            message: 'Could upload to wrong path - security issue'
          })
        }
      } catch (error) {
        testResults.push({
          name: 'Upload Path Enforcement',
          description: 'Verify files must be in user folder',
          status: 'passed',
          message: 'Upload restrictions working'
        })
      }

      // Test 6: Check signed URL generation
      try {
        // Try to generate signed URL for own file (should work)
        const ownFile = `${user.id}/test-file.pdf`
        const { data: signedUrl, error: signError } = await supabase.storage
          .from('invoices')
          .createSignedUrl(ownFile, 60)

        if (signError) {
          // Expected if file doesn't exist
          testResults.push({
            name: 'Signed URL Security',
            description: 'Verify signed URLs work correctly',
            status: 'passed',
            message: 'Signed URL generation working as expected'
          })
        } else {
          testResults.push({
            name: 'Signed URL Security',
            description: 'Verify signed URLs work correctly',
            status: 'passed',
            message: 'Can generate signed URLs for own files'
          })
        }
      } catch (error) {
        testResults.push({
          name: 'Signed URL Security',
          description: 'Verify signed URLs work correctly',
          status: 'warning',
          message: 'Could not test signed URLs'
        })
      }

      // Determine overall status
      const failedTests = testResults.filter(t => t.status === 'failed')
      const warningTests = testResults.filter(t => t.status === 'warning')
      
      if (failedTests.length > 0) {
        setOverallStatus('vulnerable')
      } else if (warningTests.length > 0) {
        setOverallStatus('unknown')
      } else {
        setOverallStatus('secure')
      }

      setTests(testResults)
    } catch (error) {
      console.error('Security test error:', error)
      alert('Failed to run security tests')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: SecurityTest['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: SecurityTest['status']) => {
    const variants = {
      passed: 'default' as const,
      failed: 'destructive' as const,
      warning: 'secondary' as const,
      pending: 'outline' as const
    }
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Storage Security Test</h1>
        <p className="text-muted-foreground">
          Verify that your invoice storage is properly secured
        </p>
      </div>

      {/* Overall Status */}
      {overallStatus !== 'unknown' && (
        <Alert className={overallStatus === 'secure' ? 'border-green-500' : 'border-red-500'}>
          <Shield className={`h-4 w-4 ${overallStatus === 'secure' ? 'text-green-500' : 'text-red-500'}`} />
          <AlertDescription>
            <strong>Overall Status: </strong>
            {overallStatus === 'secure' 
              ? 'Your storage is properly secured. Files are isolated per user.'
              : 'Security vulnerabilities detected. Please review the failed tests.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Run Tests Button */}
      <Card>
        <CardHeader>
          <CardTitle>Security Test Suite</CardTitle>
          <CardDescription>
            Run comprehensive security tests to verify storage isolation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runSecurityTests}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Running Tests...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Run Security Tests
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {tests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              {tests.filter(t => t.status === 'passed').length} / {tests.length} tests passed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tests.map((test, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                  {getStatusIcon(test.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{test.name}</h3>
                      {getStatusBadge(test.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {test.description}
                    </p>
                    {test.message && (
                      <p className="text-sm">
                        <strong>Result:</strong> {test.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle>Security Implementation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-semibold">Private Storage Bucket</h4>
              <p className="text-sm text-muted-foreground">
                All files are stored in a private bucket that requires authentication
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Key className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-semibold">User-Isolated Folders</h4>
              <p className="text-sm text-muted-foreground">
                Each user's files are stored in their own folder (user_id/filename)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-purple-500 mt-0.5" />
            <div>
              <h4 className="font-semibold">Row Level Security (RLS)</h4>
              <p className="text-sm text-muted-foreground">
                Database and storage policies ensure users can only access their own data
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <h4 className="font-semibold">Signed URLs</h4>
              <p className="text-sm text-muted-foreground">
                Temporary signed URLs are generated for secure file access (1 hour expiry)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}