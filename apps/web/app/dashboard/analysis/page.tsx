'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Building,
  CreditCard,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Calculator,
  Target,
  AlertTriangle,
  CheckCircle,
  FileBarChart,
  Users,
  Settings,
  FileStack,
  FolderOpen,
  Mail,
  ChevronDown,
  Send,
  Loader2
} from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns'

interface InvoiceData {
  id: string
  invoice_id: string
  invoice_number: string
  vendor_name: string
  total_amount: number
  subtotal: number
  tax_amount: number
  currency: string
  invoice_date: string
  payment_method?: string
  raw_ocr_data: any
  project_name?: string
  project_id: string
}

interface Project {
  id: string
  name: string
}

interface AnalysisFilters {
  projects: string[]
  dateRange: {
    start: string
    end: string
  }
  currency: string
  vendor: string
}

interface SpendingTrend {
  month: string
  amount: number
  count: number
}

interface VendorAnalysis {
  vendor: string
  total: number
  count: number
  average: number
  percentage: number
}

interface PaymentMethodAnalysis {
  method: string
  total: number
  count: number
  percentage: number
}

interface CategoryAnalysis {
  category: string
  total: number
  count: number
  percentage: number
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#EC4899', '#06B6D4']

export default function AnalysisPage() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    message: ''
  })
  const [filters, setFilters] = useState<AnalysisFilters>({
    projects: [],
    dateRange: {
      start: format(subMonths(new Date(), 12), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    },
    currency: 'all',
    vendor: 'all'
  })

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('user_id', user.id)

      if (projectsData) {
        setProjects(projectsData)
        // Default to all projects
        setFilters(prev => ({
          ...prev,
          projects: projectsData.map(p => p.id)
        }))
      }

      // Fetch invoice data with projects - try all statuses first
      const { data: invoicesData, error } = await supabase
        .from('invoices')
        .select(`
          id,
          project_id,
          processing_status,
          projects!inner(name),
          invoice_data(
            id,
            invoice_number,
            vendor_name,
            total_amount,
            subtotal,
            tax_amount,
            currency,
            invoice_date,
            raw_ocr_data
          )
        `)
        .eq('user_id', user.id)

      console.log('Raw invoices data:', invoicesData)
      console.log('Query error:', error)

      if (invoicesData && invoicesData.length > 0) {
        const transformedData: InvoiceData[] = invoicesData
          .filter(inv => {
            // Only include completed invoices with invoice data
            return inv.processing_status === 'completed' &&
                   inv.invoice_data &&
                   (Array.isArray(inv.invoice_data) ? inv.invoice_data.length > 0 : inv.invoice_data) &&
                   inv.projects
          })
          .map(inv => {
            const invoiceData = Array.isArray(inv.invoice_data) ? inv.invoice_data[0] : inv.invoice_data
            const projectData = Array.isArray(inv.projects) ? inv.projects[0] : inv.projects
            return {
              id: invoiceData?.id || inv.id,
              invoice_id: inv.id,
              invoice_number: invoiceData?.invoice_number || '',
              vendor_name: invoiceData?.vendor_name || 'Unknown',
              total_amount: Number(invoiceData?.total_amount) || 0,
              subtotal: Number(invoiceData?.subtotal) || 0,
              tax_amount: Number(invoiceData?.tax_amount) || 0,
              currency: invoiceData?.currency || 'USD',
              invoice_date: invoiceData?.invoice_date || '',
              payment_method: invoiceData?.raw_ocr_data?.payment_method || 'Unknown',
              raw_ocr_data: invoiceData?.raw_ocr_data || {},
              project_name: projectData?.name || 'Unknown Project',
              project_id: inv.project_id
            }
          })

        console.log('Transformed data:', transformedData)
        setInvoiceData(transformedData)

        // If no completed invoices, show a message
        if (transformedData.length === 0) {
          console.log('No completed invoices found. Total raw invoices:', invoicesData.length)
        }
      } else {
        console.log('No invoice data returned from query')
        setInvoiceData([])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    return invoiceData.filter(item => {
      // Project filter
      if (filters.projects.length > 0 && !filters.projects.includes(item.project_id)) {
        return false
      }

      // Date filter
      if (item.invoice_date) {
        const itemDate = parseISO(item.invoice_date)
        if (isValid(itemDate)) {
          const startDate = parseISO(filters.dateRange.start)
          const endDate = parseISO(filters.dateRange.end)
          if (itemDate < startDate || itemDate > endDate) {
            return false
          }
        }
      }

      // Currency filter
      if (filters.currency !== 'all' && item.currency !== filters.currency) {
        return false
      }

      // Vendor filter
      if (filters.vendor !== 'all' && item.vendor_name !== filters.vendor) {
        return false
      }

      return true
    })
  }, [invoiceData, filters])

  // Calculate spending trends
  const spendingTrends = useMemo(() => {
    const trends: Record<string, SpendingTrend> = {}

    filteredData.forEach(item => {
      if (item.invoice_date) {
        const date = parseISO(item.invoice_date)
        if (isValid(date)) {
          const monthKey = format(date, 'yyyy-MM')
          const monthLabel = format(date, 'MMM yyyy')

          if (!trends[monthKey]) {
            trends[monthKey] = {
              month: monthLabel,
              amount: 0,
              count: 0
            }
          }

          trends[monthKey].amount += item.total_amount
          trends[monthKey].count += 1
        }
      }
    })

    return Object.values(trends).sort((a, b) => a.month.localeCompare(b.month))
  }, [filteredData])

  // Calculate vendor analysis
  const vendorAnalysis = useMemo(() => {
    const vendors: Record<string, VendorAnalysis> = {}
    const totalSpending = filteredData.reduce((sum, item) => sum + item.total_amount, 0)

    filteredData.forEach(item => {
      const vendor = item.vendor_name || 'Unknown'

      if (!vendors[vendor]) {
        vendors[vendor] = {
          vendor,
          total: 0,
          count: 0,
          average: 0,
          percentage: 0
        }
      }

      vendors[vendor].total += item.total_amount
      vendors[vendor].count += 1
    })

    return Object.values(vendors)
      .map(vendor => ({
        ...vendor,
        average: vendor.total / vendor.count,
        percentage: totalSpending > 0 ? (vendor.total / totalSpending) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10) // Top 10 vendors
  }, [filteredData])

  // Calculate payment method analysis
  const paymentMethodAnalysis = useMemo(() => {
    const methods: Record<string, PaymentMethodAnalysis> = {}
    const totalSpending = filteredData.reduce((sum, item) => sum + item.total_amount, 0)

    filteredData.forEach(item => {
      const method = item.payment_method || 'Unknown'

      if (!methods[method]) {
        methods[method] = {
          method,
          total: 0,
          count: 0,
          percentage: 0
        }
      }

      methods[method].total += item.total_amount
      methods[method].count += 1
    })

    return Object.values(methods)
      .map(method => ({
        ...method,
        percentage: totalSpending > 0 ? (method.total / totalSpending) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total)
  }, [filteredData])

  // Auto-categorize expenses
  const categoryAnalysis = useMemo(() => {
    const categories: Record<string, CategoryAnalysis> = {}
    const totalSpending = filteredData.reduce((sum, item) => sum + item.total_amount, 0)

    filteredData.forEach(item => {
      let category = 'Other'
      const vendor = item.vendor_name?.toLowerCase() || ''
      const description = item.raw_ocr_data?.line_items?.[0]?.description?.toLowerCase() || ''

      // Auto-categorization logic
      if (vendor.includes('aws') || vendor.includes('google') || vendor.includes('microsoft') || vendor.includes('supabase')) {
        category = 'Technology & Software'
      } else if (vendor.includes('home depot') || vendor.includes('lowes') || description.includes('concrete')) {
        category = 'Hardware & Materials'
      } else if (vendor.includes('office') || description.includes('office')) {
        category = 'Office Supplies'
      } else if (vendor.includes('travel') || vendor.includes('hotel') || vendor.includes('airline')) {
        category = 'Travel & Transportation'
      } else if (vendor.includes('restaurant') || vendor.includes('food')) {
        category = 'Meals & Entertainment'
      } else if (description.includes('subscription') || description.includes('plan')) {
        category = 'Subscriptions & Services'
      }

      if (!categories[category]) {
        categories[category] = {
          category,
          total: 0,
          count: 0,
          percentage: 0
        }
      }

      categories[category].total += item.total_amount
      categories[category].count += 1
    })

    return Object.values(categories)
      .map(cat => ({
        ...cat,
        percentage: totalSpending > 0 ? (cat.total / totalSpending) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total)
  }, [filteredData])

  // Calculate forecasting
  const forecastData = useMemo(() => {
    if (spendingTrends.length < 3) return []

    // Simple linear regression for trend prediction
    const months = spendingTrends.map((_, index) => index)
    const amounts = spendingTrends.map(trend => trend.amount)

    // Calculate linear regression coefficients
    const n = months.length
    const sumX = months.reduce((a, b) => a + b, 0)
    const sumY = amounts.reduce((a, b) => a + b, 0)
    const sumXY = months.reduce((sum, x, i) => sum + x * amounts[i], 0)
    const sumXX = months.reduce((sum, x) => sum + x * x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Generate forecast for next 3 months
    const forecast = []
    const lastMonthIndex = spendingTrends.length - 1

    for (let i = 1; i <= 3; i++) {
      const futureIndex = lastMonthIndex + i
      const predictedAmount = Math.max(0, slope * futureIndex + intercept)

      // Add some seasonal adjustment based on historical patterns
      const currentMonth = new Date()
      const futureMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + i, 1)
      const monthName = format(futureMonth, 'MMM yyyy')

      // Calculate confidence interval (simple standard deviation approach)
      const residuals = amounts.map((actual, j) => actual - (slope * j + intercept))
      const stdDev = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / n)

      forecast.push({
        month: monthName,
        predicted: predictedAmount,
        lower: Math.max(0, predictedAmount - stdDev),
        upper: predictedAmount + stdDev,
        confidence: Math.max(0.6, Math.min(0.95, 1 - (stdDev / predictedAmount)))
      })
    }

    return forecast
  }, [spendingTrends])

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = filteredData.reduce((sum, item) => sum + item.total_amount, 0)
    const count = filteredData.length
    const average = count > 0 ? total / count : 0
    const taxTotal = filteredData.reduce((sum, item) => sum + (item.tax_amount || 0), 0)

    // Calculate month-over-month growth
    const currentMonth = spendingTrends[spendingTrends.length - 1]?.amount || 0
    const previousMonth = spendingTrends[spendingTrends.length - 2]?.amount || 0
    const growth = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0

    return {
      totalSpending: total,
      transactionCount: count,
      averageTransaction: average,
      taxPaid: taxTotal,
      monthlyGrowth: growth,
      topVendor: vendorAnalysis[0]?.vendor || 'N/A',
      topPaymentMethod: paymentMethodAnalysis[0]?.method || 'N/A'
    }
  }, [filteredData, spendingTrends, vendorAnalysis, paymentMethodAnalysis])

  const handleProjectChange = (projectId: string) => {
    setFilters(prev => ({
      ...prev,
      projects: prev.projects.includes(projectId)
        ? prev.projects.filter(id => id !== projectId)
        : [...prev.projects, projectId]
    }))
  }

  const exportToCSV = async () => {
    try {
      // Prepare CSV data
      const csvData = []

      // Add header row
      csvData.push([
        'Invoice Date',
        'Invoice Number',
        'Vendor Name',
        'Project Name',
        'Total Amount',
        'Subtotal',
        'Tax Amount',
        'Currency',
        'Payment Method',
        'Category'
      ])

      // Add invoice data rows
      filteredData.forEach(invoice => {
        // Auto-categorize for export
        let category = 'Other'
        const vendor = invoice.vendor_name?.toLowerCase() || ''
        const description = invoice.raw_ocr_data?.line_items?.[0]?.description?.toLowerCase() || ''

        if (vendor.includes('aws') || vendor.includes('google') || vendor.includes('microsoft') || vendor.includes('supabase')) {
          category = 'Technology & Software'
        } else if (vendor.includes('home depot') || vendor.includes('lowes') || description.includes('concrete')) {
          category = 'Hardware & Materials'
        } else if (vendor.includes('office') || description.includes('office')) {
          category = 'Office Supplies'
        } else if (vendor.includes('travel') || vendor.includes('hotel') || vendor.includes('airline')) {
          category = 'Travel & Transportation'
        } else if (vendor.includes('restaurant') || vendor.includes('food')) {
          category = 'Meals & Entertainment'
        } else if (description.includes('subscription') || description.includes('plan')) {
          category = 'Subscriptions & Services'
        }

        csvData.push([
          invoice.invoice_date || '',
          invoice.invoice_number || '',
          invoice.vendor_name || '',
          invoice.project_name || '',
          invoice.total_amount.toFixed(2),
          invoice.subtotal.toFixed(2),
          invoice.tax_amount.toFixed(2),
          invoice.currency || 'USD',
          invoice.payment_method || '',
          category
        ])
      })

      // Add summary statistics as separate section
      csvData.push([]) // Empty row
      csvData.push(['SUMMARY STATISTICS'])
      csvData.push(['Metric', 'Value'])
      csvData.push(['Total Spending', `$${summaryStats.totalSpending.toFixed(2)}`])
      csvData.push(['Total Transactions', summaryStats.transactionCount.toString()])
      csvData.push(['Average Transaction', `$${summaryStats.averageTransaction.toFixed(2)}`])
      csvData.push(['Tax Paid', `$${summaryStats.taxPaid.toFixed(2)}`])
      csvData.push(['Monthly Growth', `${summaryStats.monthlyGrowth.toFixed(1)}%`])
      csvData.push(['Top Vendor', summaryStats.topVendor])
      csvData.push(['Top Payment Method', summaryStats.topPaymentMethod])

      // Add vendor analysis
      csvData.push([]) // Empty row
      csvData.push(['VENDOR ANALYSIS'])
      csvData.push(['Vendor', 'Total Spent', 'Transaction Count', 'Average per Transaction', 'Percentage of Total'])
      vendorAnalysis.forEach(vendor => {
        csvData.push([
          vendor.vendor,
          vendor.total.toFixed(2),
          vendor.count.toString(),
          vendor.average.toFixed(2),
          `${vendor.percentage.toFixed(1)}%`
        ])
      })

      // Add category analysis
      csvData.push([]) // Empty row
      csvData.push(['CATEGORY ANALYSIS'])
      csvData.push(['Category', 'Total Spent', 'Transaction Count', 'Percentage of Total'])
      categoryAnalysis.forEach(category => {
        csvData.push([
          category.category,
          category.total.toFixed(2),
          category.count.toString(),
          `${category.percentage.toFixed(1)}%`
        ])
      })

      // Add forecasting data if available
      if (forecastData.length > 0) {
        csvData.push([]) // Empty row
        csvData.push(['SPENDING FORECAST'])
        csvData.push(['Month', 'Predicted Amount', 'Lower Bound', 'Upper Bound', 'Confidence'])
        forecastData.forEach(forecast => {
          csvData.push([
            forecast.month,
            forecast.predicted.toFixed(2),
            forecast.lower.toFixed(2),
            forecast.upper.toFixed(2),
            `${(forecast.confidence * 100).toFixed(0)}%`
          ])
        })
      }

      // Convert to CSV string
      const csvContent = csvData.map(row =>
        row.map(field => {
          // Escape fields that contain commas or quotes
          if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
            return `"${field.replace(/"/g, '""')}"`
          }
          return field
        }).join(',')
      ).join('\n')

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `expense-analysis-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Error generating CSV:', error)
      alert('Failed to generate CSV. Please try again.')
    }
  }

  const generateCSVData = () => {
    const csvData = []

    // Add header row
    csvData.push([
      'Invoice Date',
      'Invoice Number',
      'Vendor Name',
      'Project Name',
      'Total Amount',
      'Subtotal',
      'Tax Amount',
      'Currency',
      'Payment Method',
      'Category'
    ])

    // Add invoice data rows
    filteredData.forEach(invoice => {
      // Auto-categorize for export
      let category = 'Other'
      const vendor = invoice.vendor_name?.toLowerCase() || ''
      const description = invoice.raw_ocr_data?.line_items?.[0]?.description?.toLowerCase() || ''

      if (vendor.includes('aws') || vendor.includes('google') || vendor.includes('microsoft') || vendor.includes('supabase')) {
        category = 'Technology & Software'
      } else if (vendor.includes('home depot') || vendor.includes('lowes') || description.includes('concrete')) {
        category = 'Hardware & Materials'
      } else if (vendor.includes('office') || description.includes('office')) {
        category = 'Office Supplies'
      } else if (vendor.includes('travel') || vendor.includes('hotel') || vendor.includes('airline')) {
        category = 'Travel & Transportation'
      } else if (vendor.includes('restaurant') || vendor.includes('food')) {
        category = 'Meals & Entertainment'
      } else if (description.includes('subscription') || description.includes('plan')) {
        category = 'Subscriptions & Services'
      }

      csvData.push([
        invoice.invoice_date || '',
        invoice.invoice_number || '',
        invoice.vendor_name || '',
        invoice.project_name || '',
        invoice.total_amount.toFixed(2),
        invoice.subtotal.toFixed(2),
        invoice.tax_amount.toFixed(2),
        invoice.currency || 'USD',
        invoice.payment_method || '',
        category
      ])
    })

    // Add summary statistics as separate section
    csvData.push([]) // Empty row
    csvData.push(['SUMMARY STATISTICS'])
    csvData.push(['Metric', 'Value'])
    csvData.push(['Total Spending', `$${summaryStats.totalSpending.toFixed(2)}`])
    csvData.push(['Total Transactions', summaryStats.transactionCount.toString()])
    csvData.push(['Average Transaction', `$${summaryStats.averageTransaction.toFixed(2)}`])
    csvData.push(['Tax Paid', `$${summaryStats.taxPaid.toFixed(2)}`])
    csvData.push(['Monthly Growth', `${summaryStats.monthlyGrowth.toFixed(1)}%`])
    csvData.push(['Top Vendor', summaryStats.topVendor])
    csvData.push(['Top Payment Method', summaryStats.topPaymentMethod])

    // Add vendor analysis
    csvData.push([]) // Empty row
    csvData.push(['VENDOR ANALYSIS'])
    csvData.push(['Vendor', 'Total Spent', 'Transaction Count', 'Average per Transaction', 'Percentage of Total'])
    vendorAnalysis.forEach(vendor => {
      csvData.push([
        vendor.vendor,
        vendor.total.toFixed(2),
        vendor.count.toString(),
        vendor.average.toFixed(2),
        `${vendor.percentage.toFixed(1)}%`
      ])
    })

    // Add category analysis
    csvData.push([]) // Empty row
    csvData.push(['CATEGORY ANALYSIS'])
    csvData.push(['Category', 'Total Spent', 'Transaction Count', 'Percentage of Total'])
    categoryAnalysis.forEach(category => {
      csvData.push([
        category.category,
        category.total.toFixed(2),
        category.count.toString(),
        `${category.percentage.toFixed(1)}%`
      ])
    })

    // Add forecasting data if available
    if (forecastData.length > 0) {
      csvData.push([]) // Empty row
      csvData.push(['SPENDING FORECAST'])
      csvData.push(['Month', 'Predicted Amount', 'Lower Bound', 'Upper Bound', 'Confidence'])
      forecastData.forEach(forecast => {
        csvData.push([
          forecast.month,
          forecast.predicted.toFixed(2),
          forecast.lower.toFixed(2),
          forecast.upper.toFixed(2),
          `${(forecast.confidence * 100).toFixed(0)}%`
        ])
      })
    }

    // Convert to CSV string
    return csvData.map(row =>
      row.map(field => {
        // Escape fields that contain commas or quotes
        if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
          return `"${field.replace(/"/g, '""')}"`
        }
        return field
      }).join(',')
    ).join('\n')
  }

  const openEmailDialog = () => {
    // Pre-fill email form
    const reportPeriod = `${filters.dateRange.start} to ${filters.dateRange.end}`
    setEmailForm({
      to: '',
      subject: `Expense Analysis Report - ${reportPeriod}`,
      message: `Hi,

Please find attached the expense analysis report for the period ${reportPeriod}.

Summary:
• Total Spending: $${summaryStats.totalSpending.toFixed(2)}
• Total Transactions: ${summaryStats.transactionCount}
• Top Vendor: ${summaryStats.topVendor}

The attached CSV file contains detailed transaction data, vendor analysis, and spending forecasts.

Best regards`
    })
    setEmailDialogOpen(true)
  }

  const sendAnalysisEmail = async () => {
    try {
      setEmailSending(true)

      if (!emailForm.to.trim()) {
        toast.error('Please enter a recipient email address')
        return
      }

      // Generate CSV data
      const csvData = generateCSVData()
      const reportPeriod = `${filters.dateRange.start} to ${filters.dateRange.end}`

      // Send email
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailForm.to.trim(),
          subject: emailForm.subject || `Expense Analysis Report - ${reportPeriod}`,
          type: 'analysis_report',
          data: {
            csvData,
            summaryStats,
            reportPeriod,
            customMessage: emailForm.message
          }
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`Analysis report sent successfully to ${emailForm.to}`)
        setEmailDialogOpen(false)
        setEmailForm({ to: '', subject: '', message: '' })
      } else {
        toast.error(result.error || 'Failed to send email')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Failed to send email. Please try again.')
    } finally {
      setEmailSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    )
  }

  // Show empty state if no data
  if (!loading && filteredData.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-rose-500" />
              Expense Analysis
            </h1>
            <p className="text-muted-foreground">Comprehensive insights into your spending patterns</p>
          </div>
        </div>

        {/* Empty State */}
        <Card className="text-center py-16">
          <CardContent>
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Analysis Data Available</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              To see expense analysis, you need to upload and process some invoices first.
              Go to the Documents section to upload your invoices.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/dashboard/invoices">
                  <FileStack className="h-4 w-4 mr-2" />
                  Upload Documents
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/projects">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Create Project
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-rose-500" />
            Expense Analysis
          </h1>
          <p className="text-muted-foreground">Comprehensive insights into your spending patterns</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-gradient-to-r from-rose-500 to-pink-600">
              <Download className="h-4 w-4 mr-2" />
              Export
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={openEmailDialog}>
              <Mail className="h-4 w-4 mr-2" />
              Email Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Analysis Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Project Selection */}
            <div className="space-y-2">
              <Label>Projects</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {projects.map(project => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={project.id}
                      checked={filters.projects.includes(project.id)}
                      onChange={() => handleProjectChange(project.id)}
                      className="rounded"
                    />
                    <label htmlFor={project.id} className="text-sm">
                      {project.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
              />
            </div>

            {/* Currency Filter */}
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={filters.currency} onValueChange={(value) => setFilters(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summaryStats.totalSpending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.transactionCount} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
            {summaryStats.monthlyGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summaryStats.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summaryStats.monthlyGrowth >= 0 ? '+' : ''}{summaryStats.monthlyGrowth.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">vs previous month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summaryStats.averageTransaction.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Paid</CardTitle>
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summaryStats.taxPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">total tax amount</p>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Spending Trends</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Analysis</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spending Trends Over Time</CardTitle>
              <CardDescription>Monthly spending patterns and transaction volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={spendingTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'amount' ? `$${Number(value).toFixed(2)}` : value,
                        name === 'amount' ? 'Amount' : 'Transactions'
                      ]}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                      name="Amount Spent"
                    />
                    <Bar dataKey="count" fill="#10B981" name="Transaction Count" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Vendors by Spending</CardTitle>
                <CardDescription>Your highest expense vendors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vendorAnalysis.slice(0, 8)} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="vendor" type="category" width={100} />
                      <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Total Spent']} />
                      <Bar dataKey="total" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Spending distribution by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodAnalysis}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ method, percentage }) => `${method}: ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="total"
                      >
                        {paymentMethodAnalysis.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vendor Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Performance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Vendor</th>
                      <th className="text-right p-2">Total Spent</th>
                      <th className="text-right p-2">Transactions</th>
                      <th className="text-right p-2">Avg/Transaction</th>
                      <th className="text-right p-2">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorAnalysis.map((vendor, index) => (
                      <tr key={vendor.vendor} className="border-b">
                        <td className="p-2 font-medium">{vendor.vendor}</td>
                        <td className="p-2 text-right">${vendor.total.toFixed(2)}</td>
                        <td className="p-2 text-right">{vendor.count}</td>
                        <td className="p-2 text-right">${vendor.average.toFixed(2)}</td>
                        <td className="p-2 text-right">
                          <Badge variant="outline">{vendor.percentage.toFixed(1)}%</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
                <CardDescription>Auto-categorized spending breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryAnalysis}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="total"
                      >
                        {categoryAnalysis.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Detailed breakdown by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryAnalysis.map((category, index) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{category.category}</span>
                        <span>${category.total.toFixed(2)}</span>
                      </div>
                      <Progress
                        value={category.percentage}
                        className="h-2"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length] + '20'
                        }}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{category.count} transactions</span>
                        <span>{category.percentage.toFixed(1)}% of total</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      Top vendor: <strong>{summaryStats.topVendor}</strong>
                      ({vendorAnalysis[0]?.percentage.toFixed(1)}% of spending)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      Preferred payment: <strong>{summaryStats.topPaymentMethod}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      Average transaction: <strong>${summaryStats.averageTransaction.toFixed(2)}</strong>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {summaryStats.monthlyGrowth > 20 && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Spending increased {summaryStats.monthlyGrowth.toFixed(1)}% - consider budget review</span>
                    </div>
                  )}
                  {vendorAnalysis[0]?.percentage > 50 && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">High vendor concentration - consider diversifying suppliers</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Tax efficiency: {((summaryStats.taxPaid / summaryStats.totalSpending) * 100).toFixed(1)}% of spending</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Forecasting */}
          <Card>
            <CardHeader>
              <CardTitle>Spending Forecast</CardTitle>
              <CardDescription>Predicted spending for next 3 months based on trends</CardDescription>
            </CardHeader>
            <CardContent>
              {forecastData.length > 0 ? (
                <div className="space-y-6">
                  {/* Forecast Chart */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[...spendingTrends.slice(-6), ...forecastData.map(f => ({ month: f.month, amount: f.predicted, forecast: true }))]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => [
                            `$${Number(value).toFixed(2)}`,
                            name === 'amount' ? 'Actual' : 'Predicted'
                          ]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          dot={{ fill: '#3B82F6' }}
                          name="Historical"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Forecast Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {forecastData.map((forecast, index) => (
                      <Card key={forecast.month} className="relative">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{forecast.month}</CardTitle>
                          <CardDescription>Forecast {index + 1} month{index > 0 ? 's' : ''} ahead</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="text-2xl font-bold text-blue-600">
                              ${forecast.predicted.toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Range: ${forecast.lower.toFixed(2)} - ${forecast.upper.toFixed(2)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={forecast.confidence * 100}
                                className="flex-1 h-2"
                              />
                              <span className="text-xs text-muted-foreground">
                                {(forecast.confidence * 100).toFixed(0)}% confidence
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Forecast Summary */}
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Forecast Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Next 3 months total:</span>
                        <span className="ml-2">${forecastData.reduce((sum, f) => sum + f.predicted, 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="font-medium">Average confidence:</span>
                        <span className="ml-2">{(forecastData.reduce((sum, f) => sum + f.confidence, 0) / forecastData.length * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Need at least 3 months of data for forecasting</p>
                  <p className="text-sm">Add more invoices to enable spending predictions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Analysis Report
            </DialogTitle>
            <DialogDescription>
              Send the expense analysis report with CSV attachment to specified recipients.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-to">Recipient Email *</Label>
              <Input
                id="email-to"
                type="email"
                placeholder="accountant@company.com"
                value={emailForm.to}
                onChange={(e) => setEmailForm(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                placeholder="Expense Analysis Report"
                value={emailForm.subject}
                onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                placeholder="Optional message to include in the email..."
                value={emailForm.message}
                onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                rows={6}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <FileBarChart className="h-4 w-4" />
                Report Summary
              </h4>
              <div className="text-sm space-y-1">
                <p>• Total Spending: ${summaryStats.totalSpending.toFixed(2)}</p>
                <p>• Transactions: {summaryStats.transactionCount}</p>
                <p>• Period: {filters.dateRange.start} to {filters.dateRange.end}</p>
                <p>• Includes: CSV with transactions, vendor analysis, forecasts</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={sendAnalysisEmail}
              disabled={emailSending || !emailForm.to.trim()}
              className="bg-gradient-to-r from-rose-500 to-pink-600"
            >
              {emailSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}