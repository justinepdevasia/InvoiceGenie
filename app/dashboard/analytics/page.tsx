'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Calendar,
  Download,
  Filter,
  Users,
  Clock,
  Activity,
  PieChart,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

interface Analytics {
  totalInvoices: number
  totalAmount: number
  averageAmount: number
  topVendors: { name: string; count: number; amount: number }[]
  monthlyTrends: { month: string; count: number; amount: number }[]
  statusBreakdown: { status: string; count: number; percentage: number }[]
  recentActivity: { date: string; action: string; details: string }[]
  processingTime: number
  accuracyRate: number
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')
  const supabase = createClient()

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Calculate date range
      const endDate = new Date()
      let startDate = new Date()
      
      switch (dateRange) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          break
        case '1y':
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
          break
      }

      // Fetch invoices data
      const { data: invoices, error: invoicesError } = await supabase
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
          )
        `)
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (invoicesError) throw invoicesError

      // Calculate analytics
      const totalInvoices = invoices?.length || 0
      const totalAmount = invoices?.reduce((sum, inv) => 
        sum + (inv.invoice_data?.[0]?.total_amount || 0), 0
      ) || 0
      const averageAmount = totalInvoices > 0 ? totalAmount / totalInvoices : 0

      // Top vendors
      const vendorMap = new Map<string, { count: number; amount: number }>()
      invoices?.forEach(inv => {
        const vendor = inv.invoice_data?.[0]?.vendor_name || 'Unknown'
        const amount = inv.invoice_data?.[0]?.total_amount || 0
        const current = vendorMap.get(vendor) || { count: 0, amount: 0 }
        vendorMap.set(vendor, {
          count: current.count + 1,
          amount: current.amount + amount
        })
      })
      
      const topVendors = Array.from(vendorMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)

      // Monthly trends
      const monthlyMap = new Map<string, { count: number; amount: number }>()
      const months = []
      for (let i = 0; i < 6; i++) {
        const monthDate = subMonths(new Date(), i)
        const monthKey = format(monthDate, 'MMM yyyy')
        months.unshift(monthKey)
        monthlyMap.set(monthKey, { count: 0, amount: 0 })
      }

      invoices?.forEach(inv => {
        const monthKey = format(new Date(inv.created_at), 'MMM yyyy')
        if (monthlyMap.has(monthKey)) {
          const current = monthlyMap.get(monthKey)!
          const amount = inv.invoice_data?.[0]?.total_amount || 0
          monthlyMap.set(monthKey, {
            count: current.count + 1,
            amount: current.amount + amount
          })
        }
      })

      const monthlyTrends = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({ month, ...data }))

      // Status breakdown
      const statusCounts = {
        completed: 0,
        processing: 0,
        failed: 0,
        pending: 0
      }
      
      invoices?.forEach(inv => {
        const status = inv.processing_status || 'pending'
        if (status in statusCounts) {
          statusCounts[status as keyof typeof statusCounts]++
        }
      })

      const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: totalInvoices > 0 ? (count / totalInvoices) * 100 : 0
      }))

      // Recent activity
      const recentActivity = invoices
        ?.slice(0, 10)
        .map(inv => ({
          date: format(new Date(inv.created_at), 'MMM d, HH:mm'),
          action: inv.processing_status === 'completed' ? 'Processed' : 'Uploaded',
          details: `${inv.original_file_name} - ${inv.invoice_data?.[0]?.vendor_name || 'Unknown vendor'}`
        })) || []

      // Calculate average processing time and accuracy
      const processingTime = 45 // seconds (mock data)
      const accuracySum = invoices?.reduce((sum, inv) => 
        sum + (inv.invoice_data?.[0]?.confidence_score || 0), 0
      ) || 0
      const accuracyRate = totalInvoices > 0 ? (accuracySum / totalInvoices) * 100 : 0

      setAnalytics({
        totalInvoices,
        totalAmount,
        averageAmount,
        topVendors,
        monthlyTrends,
        statusBreakdown,
        recentActivity,
        processingTime,
        accuracyRate
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportAnalytics = () => {
    if (!analytics) return
    
    const data = {
      summary: {
        totalInvoices: analytics.totalInvoices,
        totalAmount: analytics.totalAmount,
        averageAmount: analytics.averageAmount,
        accuracyRate: analytics.accuracyRate,
        processingTime: analytics.processingTime
      },
      topVendors: analytics.topVendors,
      monthlyTrends: analytics.monthlyTrends,
      statusBreakdown: analytics.statusBreakdown
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.json`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const COLORS = ['#ec4899', '#f97316', '#3b82f6', '#10b981']

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
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track your invoice processing metrics and insights</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={dateRange} onValueChange={setDateRange}>
            <TabsList>
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="90d">90 Days</TabsTrigger>
              <TabsTrigger value="1y">1 Year</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={exportAnalytics} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalInvoices || 0}</div>
            <p className="text-xs text-muted-foreground">
              <ArrowUp className="inline h-3 w-3 text-green-500" /> 12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics?.totalAmount.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Average: ${analytics?.averageAmount.toFixed(2) || '0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.processingTime || 0}s</div>
            <p className="text-xs text-muted-foreground">
              <ArrowDown className="inline h-3 w-3 text-green-500" /> 5s faster
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.accuracyRate.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">AI confidence score</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Invoice count and amount over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={analytics?.monthlyTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="count" 
                  stroke="#ec4899" 
                  name="Invoice Count"
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#3b82f6" 
                  name="Total Amount ($)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Processing status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <RePieChart>
                <Pie
                  data={analytics?.statusBreakdown || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentage }) => `${status}: ${percentage.toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics?.statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Vendors and Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Vendors</CardTitle>
            <CardDescription>By invoice amount</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.topVendors.map((vendor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full`} 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {vendor.count} invoices
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${vendor.amount.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest invoice processing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                  <div className="flex-1">
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.details}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}