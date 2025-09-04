'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, FolderOpen, Upload, TrendingUp, Plus, ArrowRight, CreditCard } from 'lucide-react'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<{
    totalProjects: number;
    totalInvoices: number;
    pagesUsed: number;
    pagesLimit: number;
    recentProjects: any[];
    recentInvoices: any[];
  }>({
    totalProjects: 0,
    totalInvoices: 0,
    pagesUsed: 0,
    pagesLimit: 10,
    recentProjects: [],
    recentInvoices: [],
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      
      const [profileRes, projectsRes, invoicesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('invoices').select('*, projects(name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      ])

      const profile = profileRes.data
      const projects = projectsRes.data || []
      const invoices = invoicesRes.data || []

      setStats({
        totalProjects: projects.length,
        totalInvoices: invoices.length,
        pagesUsed: profile?.pages_used || 0,
        pagesLimit: profile?.pages_limit || 10,
        recentProjects: projects,
        recentInvoices: invoices,
      })
    }
    
    setLoading(false)
  }

  const usagePercentage = (stats.pagesUsed / stats.pagesLimit) * 100

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">Here's an overview of your invoice processing activity</p>
        </div>
        <Link href="/dashboard/upload">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Invoice
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">Active projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">Processed invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pages Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.pagesUsed} / {stats.pagesLimit}
            </div>
            <Progress value={usagePercentage} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Plan Status</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Free</div>
            <Link href="/dashboard/billing" className="text-xs text-primary hover:underline">
              Upgrade plan →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>Your latest invoice projects</CardDescription>
            </div>
            <Link href="/dashboard/projects">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No projects yet</p>
                <Link href="/dashboard/projects">
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentProjects.map((project: any) => (
                  <Link 
                    key={project.id} 
                    href={`/dashboard/projects/${project.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Latest processed invoices</CardDescription>
            </div>
            <Link href="/dashboard/invoices">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No invoices uploaded yet</p>
                <Link href="/dashboard/upload">
                  <Button size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Invoice
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentInvoices.map((invoice: any) => (
                  <Link 
                    key={invoice.id} 
                    href={`/dashboard/invoices/${invoice.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">{invoice.original_file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.projects?.name} • {new Date(invoice.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        invoice.processing_status === 'completed' 
                          ? 'bg-green-100 text-green-700' 
                          : invoice.processing_status === 'processing'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {invoice.processing_status}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Guide */}
      {stats.totalInvoices === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started with Invoice Genie</CardTitle>
            <CardDescription>Follow these steps to process your first invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                  1
                </div>
                <div>
                  <p className="font-medium">Create a Project</p>
                  <p className="text-sm text-muted-foreground">Organize your invoices by creating projects</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                  2
                </div>
                <div>
                  <p className="font-medium">Upload Invoices</p>
                  <p className="text-sm text-muted-foreground">Upload PDF or image files of your invoices</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                  3
                </div>
                <div>
                  <p className="font-medium">Review & Export</p>
                  <p className="text-sm text-muted-foreground">Review extracted data and export to CSV</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}