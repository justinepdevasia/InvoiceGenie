'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, Eye, FileText, Image, AlertCircle, Lock } from 'lucide-react'
import { getSecureFileUrl, verifyFileOwnership } from '@/lib/storage-security'

interface SecureFileViewerProps {
  filePath: string
  fileName: string
  fileType: string
  userId: string
  bucketName?: string
}

export function SecureFileViewer({
  filePath,
  fileName,
  fileType,
  userId,
  bucketName = 'invoices'
}: SecureFileViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkOwnership()
  }, [filePath, userId])

  const checkOwnership = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Verify the file belongs to the current user
    const ownershipVerified = await verifyFileOwnership(supabase, filePath, user.id)
    setIsOwner(ownershipVerified)

    if (!ownershipVerified) {
      setError('You do not have permission to access this file')
    }
  }

  const handleView = async () => {
    if (!isOwner) {
      setError('Access denied')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const url = await getSecureFileUrl(supabase, filePath, bucketName)
      if (url) {
        setSignedUrl(url)
        // Open in new tab
        window.open(url, '_blank')
      } else {
        setError('Failed to generate secure URL')
      }
    } catch (err) {
      console.error('Error viewing file:', err)
      setError('Failed to access file')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!isOwner) {
      setError('Access denied')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: downloadError } = await supabase.storage
        .from(bucketName)
        .download(filePath)

      if (downloadError) {
        throw downloadError
      }

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error downloading file:', err)
      setError('Failed to download file')
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = () => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-12 w-12 text-blue-500" />
    }
    return <FileText className="h-12 w-12 text-gray-500" />
  }

  if (!isOwner) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Lock className="h-8 w-8 text-red-500" />
          <div>
            <p className="font-semibold">Access Denied</p>
            <p className="text-sm text-muted-foreground">
              You do not have permission to view this file
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {getFileIcon()}
          <div>
            <h3 className="font-semibold">{fileName}</h3>
            <p className="text-sm text-muted-foreground">
              {(fileType || 'Unknown type')} • Secure Storage
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            disabled={loading}
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>This file is stored securely and only accessible by you</span>
        </div>
      </div>
    </Card>
  )
}