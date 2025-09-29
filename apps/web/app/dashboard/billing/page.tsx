'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  CreditCard,
  Receipt,
  AlertCircle,
  CheckCircle,
  Download,
  ExternalLink,
  Calendar,
  Users,
  FileText,
  TrendingUp,
  ChevronRight,
  Info,
  Plus
} from 'lucide-react'
import { format } from 'date-fns'

interface BillingData {
  subscription: {
    plan: string
    status: string
    currentPeriodEnd: string
    nextBillingDate: string
    amount: number
  }
  usage: {
    pagesProcessed: number
    pagesLimit: number
    storageUsed: number
    storageLimit: number
    apiCalls: number
    apiLimit: number
  }
  paymentMethod: {
    type: string
    last4: string
    expiryMonth: number
    expiryYear: number
    brand: string
  }
  invoices: Array<{
    id: string
    date: string
    amount: number
    status: string
    downloadUrl: string
  }>
  upcomingInvoice: {
    amount: number
    date: string
    items: Array<{
      description: string
      amount: number
    }>
  }
}

export default function BillingPage() {
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingUpgrade, setProcessingUpgrade] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchBillingData()
  }, [])

  const fetchBillingData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch subscription and usage data from API
      const response = await fetch('/api/subscriptions')
      if (!response.ok) {
        throw new Error('Failed to fetch subscription data')
      }

      const { subscription, usage } = await response.json()

      const billingData: BillingData = {
        subscription: {
          plan: subscription.plan || 'free',
          status: subscription.status || 'active',
          currentPeriodEnd: subscription.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          nextBillingDate: subscription.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: subscription.amount ? subscription.amount / 100 : 0 // Convert cents to dollars
        },
        usage: {
          pagesProcessed: usage.pages_processed || 0,
          pagesLimit: usage.pages_limit || 10,
          storageUsed: usage.storage_used || 0,
          storageLimit: usage.storage_limit || 524288000, // 500MB
          apiCalls: usage.api_calls || 0,
          apiLimit: usage.api_limit || 1000
        },
        paymentMethod: {
          type: 'card',
          last4: '****',
          expiryMonth: 12,
          expiryYear: 2025,
          brand: 'Card'
        },
        invoices: [],
        upcomingInvoice: {
          amount: subscription.amount ? subscription.amount / 100 : 0,
          date: subscription.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          items: subscription.plan !== 'free' ? [
            {
              description: `${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan - Monthly`,
              amount: subscription.amount ? subscription.amount / 100 : 0
            }
          ] : []
        }
      }

      setBillingData(billingData)
    } catch (error) {
      console.error('Error fetching billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgradePlan = async (plan: string) => {
    setProcessingUpgrade(true)
    try {
      let priceId = ''
      if (plan === 'starter') {
        priceId = 'price_1SCOTyCLn8BJ56M1w3fVfwn3' // $20/month for 300 pages
      } else if (plan === 'professional') {
        priceId = 'price_1SCOTyCLn8BJ56M1bs7K4hGl' // $50/month for 1000 pages
      }

      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ priceId })
      })

      const data = await response.json()

      if (response.ok && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create subscription')
      }
    } catch (error) {
      console.error('Error upgrading plan:', error)
      alert('Failed to upgrade plan. Please try again.')
    } finally {
      setProcessingUpgrade(false)
    }
  }

  const handleUpdatePaymentMethod = async () => {
    try {
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok && data.url) {
        // Redirect to Stripe Customer Portal
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to open customer portal')
      }
    } catch (error) {
      console.error('Error opening customer portal:', error)
      alert('Failed to open payment management. Please try again.')
    }
  }

  const handleCancelSubscription = async () => {
    if (confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      try {
        const response = await fetch('/api/subscriptions/portal', {
          method: 'POST'
        })

        const data = await response.json()

        if (response.ok && data.url) {
          // Redirect to Stripe Customer Portal where they can cancel
          window.location.href = data.url
        } else {
          throw new Error(data.error || 'Failed to open customer portal')
        }
      } catch (error) {
        console.error('Error opening customer portal:', error)
        alert('Failed to open subscription management. Please try again.')
      }
    }
  }

  const plans = [
    {
      name: 'free',
      displayName: 'Free',
      price: 0,
      features: ['10 pages/month', '500MB storage', '1,000 API calls', 'Basic support'],
      current: billingData?.subscription.plan === 'free'
    },
    {
      name: 'starter',
      displayName: 'Starter',
      price: 20,
      features: ['300 pages/month', '5GB storage', '5,000 API calls', 'Priority support', 'Email support'],
      current: billingData?.subscription.plan === 'starter',
      recommended: true
    },
    {
      name: 'professional',
      displayName: 'Professional',
      price: 50,
      features: ['1,000 pages/month', '20GB storage', '20,000 API calls', '24/7 support', 'Custom integrations', 'Priority processing'],
      current: billingData?.subscription.plan === 'professional'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription, payment methods, and billing history</p>
      </div>

      {/* Current Plan */}
      <div className="max-w-md">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Current Plan: {billingData?.subscription.plan}
                  <Badge variant={billingData?.subscription.status === 'active' ? 'default' : 'secondary'}>
                    {billingData?.subscription.status}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {billingData?.subscription.plan === 'Free'
                    ? 'You are on the free plan.'
                    : `Renews ${format(new Date(billingData?.subscription.nextBillingDate || ''), 'MMM d, yyyy')}`
                  }
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold">
                  ${billingData?.subscription.amount || 0}/mo
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>


      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">Plans & Pricing</TabsTrigger>
          <TabsTrigger value="payment">Payment Method</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Invoice</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.name} className={plan.recommended ? 'border-rose-500 border-2' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{plan.displayName}</CardTitle>
                      <p className="text-3xl font-bold mt-2">${plan.price}/mo</p>
                    </div>
                    {plan.recommended && (
                      <Badge className="bg-rose-500">Recommended</Badge>
                    )}
                    {plan.current && (
                      <Badge variant="secondary">Current</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.current ? 'outline' : 'default'}
                    disabled={plan.current || processingUpgrade}
                    onClick={() => handleUpgradePlan(plan.name)}
                  >
                    {plan.current ? 'Current Plan' : `Upgrade to ${plan.displayName}`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>
                Manage your payment methods for automatic billing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <CreditCard className="h-8 w-8 text-gray-600" />
                    <div>
                      <p className="font-medium">
                        {billingData?.paymentMethod.brand} ending in {billingData?.paymentMethod.last4}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Expires {billingData?.paymentMethod.expiryMonth}/{billingData?.paymentMethod.expiryYear}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Default</Badge>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleUpdatePaymentMethod}>
                    Update Payment Method
                  </Button>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Card
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>
                Update your billing address and tax information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Billing Email</p>
                  <p className="text-sm text-muted-foreground">user@example.com</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Billing Address</p>
                  <p className="text-sm text-muted-foreground">
                    123 Main Street<br />
                    San Francisco, CA 94102<br />
                    United States
                  </p>
                </div>
                <Button variant="outline">Update Billing Information</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>
                Download your past invoices for accounting purposes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {billingData?.invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Receipt className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium">
                          {format(new Date(invoice.date), 'MMMM d, yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Invoice #{invoice.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">${invoice.amount}</span>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                        {invoice.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Invoice</CardTitle>
              <CardDescription>
                Preview of your next billing cycle charges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <p className="font-medium">Next billing date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(billingData?.upcomingInvoice.date || ''), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <p className="text-2xl font-bold">
                    ${billingData?.upcomingInvoice.amount}
                  </p>
                </div>

                <div className="space-y-2">
                  {billingData?.upcomingInvoice.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-2">
                      <span className="text-sm">{item.description}</span>
                      <span className="text-sm font-medium">${item.amount}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="font-medium">Total</span>
                    <span className="font-bold">${billingData?.upcomingInvoice.amount}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardHeader>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <CardTitle className="text-orange-900 dark:text-orange-100">
                    Subscription Management
                  </CardTitle>
                  <CardDescription className="text-orange-800 dark:text-orange-200">
                    Need to make changes to your subscription?
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancelSubscription}>
                  Cancel Subscription
                </Button>
                <Button variant="outline">
                  Pause Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}