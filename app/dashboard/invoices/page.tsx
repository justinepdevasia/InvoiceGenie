'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  Download,
  Eye,
  Trash2,
  MoreHorizontal,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Building,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Upload,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Mail,
  Printer,
  X,
  FileCheck,
  Image,
  FolderOpen,
  Home,
  ChevronRight as ChevronRightIcon
} from 'lucide-react'
import { format } from 'date-fns'
import { useDropzone } from 'react-dropzone'

interface Invoice {
  id: string
  invoice_number: string
  vendor_name: string
  amount: number
  currency: string
  invoice_date: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  file_name: string
  created_at: string
  confidence_score: number
  tags: string[]
  project_id: string
  project_name?: string
}

interface FileWithPreview {
  file: File
  preview?: string
  id: string
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'
  progress: number
  error?: string
  name: string
  size: number
  type: string
}

interface Project {
  id: string
  name: string
}

export default function InvoicesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'vendor'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('documents')

  // Upload related state
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)

  const itemsPerPage = 10
  const supabase = createClient()

  useEffect(() => {
    fetchInvoices()
    fetchProjects()

    // Handle URL parameters
    const tab = searchParams.get('tab')
    const project = searchParams.get('project')

    if (tab === 'upload') {
      setActiveTab('upload')
    }

    if (project) {
      setSelectedProject(project)
    }
  }, [searchParams])

  useEffect(() => {
    filterAndSortInvoices()
  }, [invoices, searchTerm, statusFilter, dateFilter, projectFilter, sortBy, sortOrder])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch invoices with their data and project info
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_data (
            invoice_number,
            vendor_name,
            total_amount,
            currency,
            invoice_date,
            confidence_score
          ),
          projects (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform data for display
      const transformedInvoices: Invoice[] = data?.map(inv => ({
        id: inv.id,
        invoice_number: inv.invoice_data?.[0]?.invoice_number || `INV-${inv.id.slice(0, 8)}`,
        vendor_name: inv.invoice_data?.[0]?.vendor_name || 'Unknown Vendor',
        amount: inv.invoice_data?.[0]?.total_amount || 0,
        currency: inv.invoice_data?.[0]?.currency || 'USD',
        invoice_date: inv.invoice_data?.[0]?.invoice_date || inv.created_at,
        status: determineStatus(inv),
        file_name: inv.original_file_name,
        created_at: inv.created_at,
        confidence_score: inv.invoice_data?.[0]?.confidence_score || 0,
        tags: inv.tags || [],
        project_id: inv.project_id,
        project_name: inv.projects?.name || 'Unknown Project'
      })) || []

      setInvoices(transformedInvoices)
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const determineStatus = (invoice: any): Invoice['status'] => {
    if (invoice.processing_status === 'failed') return 'failed'
    if (invoice.processing_status === 'processing') return 'processing'
    if (invoice.processing_status === 'completed') return 'completed'
    return 'pending'
  }

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const filterAndSortInvoices = () => {
    let filtered = [...invoices]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(inv => 
        inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.file_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter)
    }

    // Project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter(inv => inv.project_id === projectFilter)
    }

    // Date filter
    const now = new Date()
    if (dateFilter !== 'all') {
      filtered = filtered.filter(inv => {
        const invoiceDate = new Date(inv.created_at)
        switch (dateFilter) {
          case 'today':
            return invoiceDate.toDateString() === now.toDateString()
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            return invoiceDate >= weekAgo
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            return invoiceDate >= monthAgo
          default:
            return true
        }
      })
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
        case 'vendor':
          comparison = a.vendor_name.localeCompare(b.vendor_name)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredInvoices(filtered)
  }

  // Upload functionality
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    const newFiles: FileWithPreview[] = acceptedFiles.map(file => ({
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending' as const,
      progress: 0
    }))

    setFiles(prev => [...prev, ...newFiles])

    if (rejectedFiles.length > 0) {
      toast.error(`${rejectedFiles.length} file(s) rejected. Please ensure files are PDFs or images under 10MB.`)
    } else if (newFiles.length > 0) {
      toast.success(`${newFiles.length} file(s) added successfully!`)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  })

  const removeFile = (fileId: string) => {
    setFiles(files => files.filter(f => f.id !== fileId))
  }

  const uploadFiles = async () => {
    if (!selectedProject) {
      toast.error('Please select a project first')
      return
    }

    if (files.length === 0) {
      toast.error('Please add files to upload')
      return
    }

    setIsUploading(true)
    setUploadComplete(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      for (const fileWrapper of files) {
        try {
          setFiles(prev => prev.map(f =>
            f.id === fileWrapper.id
              ? { ...f, status: 'uploading', progress: 30 }
              : f
          ))

          const fileName = `${user.id}/${selectedProject}/${Date.now()}-${fileWrapper.name}`

          let filePath = fileName
          try {
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('documents')
              .upload(fileName, fileWrapper.file, {
                contentType: fileWrapper.type || 'application/pdf',
                cacheControl: '3600',
                upsert: false
              })

            if (uploadError) {
              console.error('Storage upload failed:', uploadError)
              throw new Error(`Storage upload failed: ${uploadError.message}`)
            }

            filePath = uploadData.path
            console.log('File uploaded successfully to:', filePath)
          } catch (storageErr) {
            console.error('Storage upload error:', storageErr)
            throw new Error(`Failed to upload file: ${storageErr instanceof Error ? storageErr.message : 'Unknown error'}`)
          }

          setFiles(prev => prev.map(f =>
            f.id === fileWrapper.id
              ? { ...f, status: 'uploading', progress: 60 }
              : f
          ))

          // Create invoice record
          const { data: invoiceData, error: invoiceError } = await supabase
            .from('invoices')
            .insert([{
              project_id: selectedProject,
              user_id: user.id,
              file_path: filePath,
              original_file_name: fileWrapper.name,
              file_type: fileWrapper.type || 'application/octet-stream',
              file_size: fileWrapper.size,
              processing_status: 'pending'
            }])
            .select()
            .single()

          if (invoiceError) throw invoiceError

          setFiles(prev => prev.map(f =>
            f.id === fileWrapper.id
              ? { ...f, status: 'processing', progress: 80 }
              : f
          ))

          // Convert file to base64 and send to OCR
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const result = reader.result as string
              const base64 = result.split(',')[1]
              resolve(base64)
            }
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(fileWrapper.file)
          })

          const ocrResponse = await fetch('/api/ocr/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              invoiceId: invoiceData.id,
              base64Data: base64Data,
              fileType: fileWrapper.type || 'application/octet-stream',
              fileName: fileWrapper.name
            })
          })

          const responseText = await ocrResponse.text()

          if (ocrResponse.ok) {
            setFiles(prev => prev.map(f =>
              f.id === fileWrapper.id
                ? { ...f, status: 'completed', progress: 100 }
                : f
            ))
          } else {
            let errorMessage = 'OCR processing failed'
            try {
              const errorData = JSON.parse(responseText)
              errorMessage = errorData.error || errorData.details || errorMessage
            } catch (e) {
              errorMessage = responseText || errorMessage
            }

            setFiles(prev => prev.map(f =>
              f.id === fileWrapper.id
                ? { ...f, status: 'failed', error: errorMessage }
                : f
            ))
            continue
          }

        } catch (error) {
          console.error(`Error uploading ${fileWrapper.name}:`, error)
          setFiles(prev => prev.map(f =>
            f.id === fileWrapper.id
              ? { ...f, status: 'failed', error: 'Upload failed' }
              : f
          ))
        }
      }

      setUploadComplete(true)
      toast.success(`${files.length} document(s) uploaded and processing started!`)

      // Refresh the documents list
      fetchInvoices()
    } catch (error) {
      console.error('Error during upload:', error)
      toast.error('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const getFileIcon = (file: FileWithPreview) => {
    if (file.type && file.type.startsWith('image/')) {
      return <Image className="h-8 w-8" />
    }
    return <FileText className="h-8 w-8" />
  }

  const getUploadStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'uploading':
      case 'processing':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
      default:
        return <FileCheck className="h-5 w-5 text-gray-400" />
    }
  }

  const handleBulkAction = (action: string) => {
    if (selectedInvoices.length === 0) {
      alert('Please select invoices first')
      return
    }

    switch (action) {
      case 'export':
        exportInvoices(selectedInvoices)
        break
      case 'delete':
        if (confirm(`Delete ${selectedInvoices.length} invoices?`)) {
          deleteInvoices(selectedInvoices)
        }
        break
      case 'email':
        alert(`Emailing ${selectedInvoices.length} invoices...`)
        break
    }
  }

  const exportInvoices = (ids: string[]) => {
    const data = invoices.filter(inv => ids.includes(inv.id))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices-${format(new Date(), 'yyyy-MM-dd')}.json`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const deleteInvoices = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .in('id', ids)

      if (error) throw error
      
      setInvoices(prev => prev.filter(inv => !ids.includes(inv.id)))
      setSelectedInvoices([])
      alert('Invoices deleted successfully')
    } catch (error) {
      console.error('Error deleting invoices:', error)
      alert('Failed to delete invoices')
    }
  }

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: Invoice['status']) => {
    const variants: Record<Invoice['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      processing: 'secondary',
      pending: 'outline',
      failed: 'destructive'
    }
    return <Badge variant={variants[status]}>{status}</Badge>
  }

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Summary stats
  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0)
  const completedAmount = filteredInvoices
    .filter(inv => inv.status === 'completed')
    .reduce((sum, inv) => sum + inv.amount, 0)
  const processingAmount = filteredInvoices
    .filter(inv => inv.status === 'processing')
    .reduce((sum, inv) => sum + inv.amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Manage and track all your processed expense documents</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            All Documents
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload New
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredInvoices.length}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.length} total documents in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Across all documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${completedAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredInvoices.filter(inv => inv.status === 'completed').length} documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${processingAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredInvoices.filter(inv => inv.status === 'processing').length} documents
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedInvoices.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleBulkAction('export')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export ({selectedInvoices.length})
                </Button>
                <Button variant="outline" onClick={() => handleBulkAction('email')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button variant="destructive" onClick={() => handleBulkAction('delete')}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.length === paginatedInvoices.length && paginatedInvoices.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInvoices(paginatedInvoices.map(inv => inv.id))
                        } else {
                          setSelectedInvoices([])
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Doc #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInvoices([...selectedInvoices, invoice.id])
                          } else {
                            setSelectedInvoices(selectedInvoices.filter(id => id !== invoice.id))
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/invoices/${invoice.id}`} className="hover:text-rose-500">
                        {invoice.invoice_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        {invoice.vendor_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-muted-foreground">
                          {invoice.project_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        ${invoice.amount.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.invoice_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invoice.status)}
                        {getStatusBadge(invoice.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/invoices/${invoice.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} documents
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          {/* Project Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Project</CardTitle>
              <CardDescription>
                Choose which project these expense documents belong to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={selectedProject ? projects.find(p => p.id === selectedProject)?.name || 'Select a project' : 'Select a project'} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4" />
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/projects')}
                >
                  Manage Projects
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Upload Layout - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-fit">
            {/* Left Side - Upload Area */}
            <div className="space-y-4">
              <Card className="h-fit">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Documents
                  </CardTitle>
                  <CardDescription>
                    Drag & drop files or click to browse
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div
                    {...getRootProps()}
                    className={`
                      border-2 border-dashed rounded-lg m-6 p-8 text-center cursor-pointer
                      transition-all duration-300 transform
                      ${isDragActive
                        ? 'border-primary bg-primary/10 scale-105 shadow-lg'
                        : 'border-gray-300 hover:border-primary hover:bg-primary/5 hover:scale-102'
                      }
                    `}
                  >
                    <input {...getInputProps()} />
                    <div className={`transition-all duration-300 ${isDragActive ? 'scale-110' : ''}`}>
                      <Upload className={`h-12 w-12 mx-auto mb-4 transition-colors duration-300 ${
                        isDragActive ? 'text-primary' : 'text-gray-400'
                      }`} />
                    </div>
                    {isDragActive ? (
                      <div className="space-y-2">
                        <p className="text-lg font-bold text-primary">Drop files here!</p>
                        <p className="text-primary/80">Release to upload</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <p className="text-lg font-bold mb-1 text-gray-900">
                            Drop files here
                          </p>
                          <p className="text-gray-600">
                            or click to browse
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-1 text-xs text-gray-500">
                          <span className="bg-gray-100 px-2 py-1 rounded">PDF</span>
                          <span className="bg-gray-100 px-2 py-1 rounded">PNG</span>
                          <span className="bg-gray-100 px-2 py-1 rounded">JPG</span>
                          <span className="bg-gray-100 px-2 py-1 rounded">JPEG</span>
                          <span className="bg-gray-100 px-2 py-1 rounded">GIF</span>
                          <span className="bg-gray-100 px-2 py-1 rounded">WebP</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Max: 10MB per file
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Upload Actions */}
              {files.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {files.length} file{files.length > 1 ? 's' : ''} ready
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFiles([])}
                          disabled={isUploading}
                        >
                          Clear All
                        </Button>
                        <Button
                          size="sm"
                          onClick={uploadFiles}
                          disabled={isUploading || !selectedProject || files.length === 0}
                          className="bg-gradient-to-r from-rose-500 to-pink-600"
                        >
                          {isUploading ? 'Uploading...' : 'Upload All'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Side - File List */}
            <div className="space-y-4">
              <Card className="h-fit">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Selected Files ({files.length})
                  </CardTitle>
                  <CardDescription>
                    {files.length === 0
                      ? "Files will appear here after selection"
                      : `${files.filter(f => f.status === 'completed').length} completed, ${files.filter(f => f.status === 'failed').length} failed`
                    }
                  </CardDescription>
                </CardHeader>
                {files.length > 0 && (
                  <CardContent className="max-h-96 overflow-y-auto">
                    <div className="space-y-3">
                      {files.map(file => (
                        <div
                          key={file.id}
                          className="flex items-start gap-3 p-3 border rounded-lg hover:shadow-sm transition-shadow"
                        >
                          <div className="flex-shrink-0 mt-1">
                            {getFileIcon(file)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Processing...'}
                            </p>
                            {file.status === 'uploading' || file.status === 'processing' ? (
                              <div className="mt-2 space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-primary font-medium">
                                    {file.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                                  </span>
                                  <span className="text-muted-foreground">{file.progress}%</span>
                                </div>
                                <Progress
                                  value={file.progress}
                                  className="h-1.5"
                                />
                              </div>
                            ) : file.error ? (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-xs text-red-700 font-medium">Upload Failed</p>
                                <p className="text-xs text-red-600 mt-1 break-words">{file.error}</p>
                              </div>
                            ) : file.status === 'completed' ? (
                              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                                <p className="text-xs text-green-700 font-medium">Successfully processed!</p>
                              </div>
                            ) : null}
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-2">
                            {getUploadStatusIcon(file.status)}
                            {file.status === 'pending' && !isUploading && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(file.id)}
                                className="hover:bg-red-50 hover:text-red-600 h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
                {files.length === 0 && (
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No files selected</p>
                      <p className="text-xs mt-1">Add files using the upload area</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>

          {/* Upload Success */}
          {uploadComplete && (
            <div className="max-w-2xl mx-auto">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Upload Successful!</h3>
                    <p className="text-green-700 mt-1">
                      {files.length} document{files.length > 1 ? 's' : ''} uploaded and being processed
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button
                      onClick={() => setActiveTab('documents')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Documents
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFiles([])
                        setUploadComplete(false)
                      }}
                      className="border-green-200 text-green-700 hover:bg-green-50"
                    >
                      Upload More
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}