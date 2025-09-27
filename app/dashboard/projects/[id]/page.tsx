'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  DollarSign, 
  Upload,
  Download,
  Filter,
  Search,
  Eye,
  Trash2
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Project {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

interface Invoice {
  id: string
  original_file_name: string
  processing_status: string
  page_count: number
  created_at: string
  invoice_data?: {
    invoice_number: string
    vendor_name: string
    total_amount: number
    currency: string
    invoice_date: string
  }[]
}

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      fetchProjectDetails()
      fetchProjectInvoices()
    }
  }, [params.id])

  const fetchProjectDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setProject(data)
    } catch (error) {
      console.error('Error fetching project:', error)
    }
  }

  const fetchProjectInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_data (
            invoice_number,
            vendor_name,
            total_amount,
            currency,
            invoice_date
          )
        `)
        .eq('project_id', params.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)

      if (error) throw error
      fetchProjectInvoices()
    } catch (error) {
      console.error('Error deleting invoice:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`/api/export/csv?project=${params.id}&format=summary`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${project?.name}-invoices.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export CSV');
    }
  }

  const filteredInvoices = invoices.filter(invoice =>
    invoice.original_file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.invoice_data?.[0]?.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.invoice_data?.[0]?.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalAmount = invoices.reduce((sum, invoice) => 
    sum + (invoice.invoice_data?.[0]?.total_amount || 0), 0
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/projects')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Button>

        {project && (
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Pages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.reduce((sum, inv) => sum + (inv.page_count || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Amount</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalAmount.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Processing Status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.filter(inv => inv.processing_status === 'completed').length} / {invoices.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Documents</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleExportCSV}
                disabled={invoices.length === 0}
              >
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              <Button 
                onClick={() => router.push(`/dashboard/upload?project=${params.id}`)}
                className="bg-gradient-primary"
              >
                <Upload className="mr-2 h-4 w-4" /> Upload Document
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No invoices found' : 'No invoices yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try adjusting your search query'
                  : 'Upload your first expense document to this project'
                }
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => router.push(`/dashboard/upload?project=${params.id}`)}
                  className="bg-gradient-primary"
                >
                  <Upload className="mr-2 h-4 w-4" /> Upload First Document
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{invoice.original_file_name}</span>
                      <Badge className={getStatusColor(invoice.processing_status)}>
                        {invoice.processing_status}
                      </Badge>
                    </div>
                    {invoice.invoice_data?.[0] && (
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Invoice #{invoice.invoice_data[0].invoice_number} • {invoice.invoice_data[0].vendor_name}</div>
                        <div>
                          {invoice.invoice_data[0].currency} {invoice.invoice_data[0].total_amount?.toFixed(2)} • 
                          {invoice.invoice_data[0].invoice_date && 
                            ` ${format(new Date(invoice.invoice_data[0].invoice_date), 'MMM d, yyyy')}`
                          }
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {invoice.page_count} pages • Uploaded {formatDistanceToNow(new Date(invoice.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" /> View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteInvoice(invoice.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}