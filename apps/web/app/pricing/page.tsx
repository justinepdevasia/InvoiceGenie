'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  FileText,
  Zap,
  Shield,
  Users,
  BarChart,
  Clock,
  Globe,
  Headphones,
  Code,
  TrendingUp
} from 'lucide-react'

interface PricingPlan {
  id: string
  name: string
  description: string
  price: {
    monthly: number
    yearly: number
  }
  pages: number | 'Unlimited'
  features: {
    text: string
    included: boolean
    highlight?: boolean
  }[]
  badge?: string
  highlighted?: boolean
  stripePriceId?: {
    monthly: string
    yearly: string
  }
}

export default function PricingPage() {
  const router = useRouter()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for trying out',
      price: { monthly: 0, yearly: 0 },
      pages: 10,
      features: [
        { text: '10 pages per month', included: true },
        { text: 'Basic OCR processing', included: true },
        { text: 'CSV export', included: true },
        { text: 'Advanced OCR with AI', included: false },
        { text: 'Multiple export formats', included: false },
        { text: 'Batch processing', included: false }
      ]
    },
    {
      id: 'starter',
      name: 'Starter',
      description: 'For small businesses',
      price: { monthly: 20, yearly: 200 },
      pages: 300,
      stripePriceId: {
        monthly: 'price_1SCOTyCLn8BJ56M1w3fVfwn3',
        yearly: 'price_starter_yearly'
      },
      features: [
        { text: '300 pages per month', included: true },
        { text: 'Advanced OCR with AI', included: true },
        { text: 'Multiple export formats', included: true },
        { text: 'Batch processing', included: true },
        { text: 'Premium OCR accuracy', included: false },
        { text: 'Unlimited pages', included: false }
      ]
    },
    {
      id: 'pro',
      name: 'Professional',
      description: 'For growing teams',
      price: { monthly: 50, yearly: 500 },
      pages: 1000,
      badge: 'Most Popular',
      highlighted: true,
      stripePriceId: {
        monthly: 'price_1SCOTyCLn8BJ56M1bs7K4hGl',
        yearly: 'price_pro_yearly'
      },
      features: [
        { text: '1000 pages per month', included: true, highlight: true },
        { text: 'Premium OCR accuracy', included: true },
        { text: 'All export formats', included: true },
        { text: 'Batch processing', included: true },
        { text: 'Advanced AI processing', included: true, highlight: true },
        { text: 'Unlimited pages', included: false }
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large organizations',
      price: { monthly: 149, yearly: 1490 },
      pages: 'Unlimited',
      stripePriceId: {
        monthly: 'price_enterprise_monthly',
        yearly: 'price_enterprise_yearly'
      },
      features: [
        { text: 'Unlimited pages', included: true, highlight: true },
        { text: 'Custom AI training', included: true, highlight: true },
        { text: 'All export formats', included: true },
        { text: 'Advanced AI processing', included: true },
        { text: 'White-label options', included: true },
        { text: 'On-premise deployment', included: true }
      ]
    }
  ]

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!user) {
      router.push('/signup')
      return
    }

    if (plan.id === 'free') {
      router.push('/dashboard')
      return
    }

    setLoading(true)
    try {
      const priceId = plan.stripePriceId?.[billingPeriod]

      if (!priceId) {
        alert('Price not configured for this plan.')
        return
      }

      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription')
      }

      if (data.url) {
        window.location.href = data.url
      }

    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to start subscription. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const yearlyDiscount = 17 // percentage

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/20 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative">
              <FileText className="h-8 w-8 text-rose-500" />
              <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
              Expensa
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/api-docs">
              <Button variant="ghost">API Docs</Button>
            </Link>
            {user ? (
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-rose-500 to-pink-600">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-yellow-100 text-yellow-700 border-yellow-200">
            <Zap className="h-3 w-3 mr-1 inline" />
            Simple, Transparent Pricing
          </Badge>
          <h1 className="text-5xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Start free and scale as you grow. No hidden fees, cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 flex justify-center">
            <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as 'monthly' | 'yearly')}>
              <TabsList className="grid w-64 grid-cols-2">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">
                  Yearly
                  <Badge className="ml-2 bg-green-100 text-green-700">
                    Save {yearlyDiscount}%
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan) => {
            const price = billingPeriod === 'yearly' 
              ? Math.floor(plan.price.yearly / 12)
              : plan.price.monthly

            return (
              <Card 
                key={plan.id}
                className={`relative hover:shadow-2xl transition-all ${
                  plan.highlighted 
                    ? 'border-rose-500 shadow-xl scale-105 bg-gradient-to-b from-rose-50 to-white dark:from-rose-950 dark:to-gray-950' 
                    : 'hover:-translate-y-2'
                }`}
              >
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-500 to-pink-600 text-white border-0">
                    {plan.badge}
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${price}</span>
                    {plan.price.monthly > 0 && (
                      <span className="text-gray-600 dark:text-gray-400">
                        /{billingPeriod === 'yearly' ? 'mo' : 'month'}
                      </span>
                    )}
                  </div>
                  {billingPeriod === 'yearly' && plan.price.yearly > 0 && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      ${plan.price.yearly} billed annually
                    </p>
                  )}
                  <div className="mt-2">
                    <span className="text-2xl font-semibold">
                      {typeof plan.pages === 'number' ? plan.pages.toLocaleString() : plan.pages}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">
                      {typeof plan.pages === 'number' ? 'pages/month' : ''}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.slice(0, 9).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                          feature.included 
                            ? feature.highlight 
                              ? 'text-rose-500' 
                              : 'text-green-500'
                            : 'text-gray-300 dark:text-gray-700'
                        }`} />
                        <span className={`text-sm ${
                          !feature.included && 'text-gray-400 line-through'
                        } ${feature.highlight && 'font-semibold'}`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${
                      plan.highlighted 
                        ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg' 
                        : ''
                    }`}
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan)}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : user ? 'Subscribe' : 'Get Started'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Feature Comparison */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl">Detailed Feature Comparison</CardTitle>
            <CardDescription>
              Everything you need to know about each plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Feature</th>
                    <th className="text-center py-3 px-4">Free</th>
                    <th className="text-center py-3 px-4">Starter</th>
                    <th className="text-center py-3 px-4 bg-rose-50 dark:bg-rose-950/20">Pro</th>
                    <th className="text-center py-3 px-4">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Pages per month', free: '10', starter: '300', pro: '1000', enterprise: 'Unlimited' },
                    { feature: 'OCR Processing', free: 'Basic', starter: 'Advanced AI', pro: 'Premium AI', enterprise: 'Custom AI' },
                    { feature: 'Export Formats', free: 'CSV', starter: 'Multiple', pro: 'All formats', enterprise: 'All + Custom' },
                    { feature: 'Batch Processing', free: '❌', starter: '✅', pro: '✅', enterprise: '✅' },
                    { feature: 'Custom Training', free: '❌', starter: '❌', pro: '❌', enterprise: '✅' },
                    { feature: 'White Label', free: '❌', starter: '❌', pro: '❌', enterprise: '✅' },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-3 px-4 font-medium">{row.feature}</td>
                      <td className="text-center py-3 px-4">{row.free}</td>
                      <td className="text-center py-3 px-4">{row.starter}</td>
                      <td className="text-center py-3 px-4 bg-rose-50 dark:bg-rose-950/20 font-semibold">{row.pro}</td>
                      <td className="text-center py-3 px-4">{row.enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                q: 'Can I change plans anytime?',
                a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.'
              },
              {
                q: 'What happens if I exceed my page limit?',
                a: 'We\'ll notify you when you reach 80% of your limit. You can upgrade or purchase additional pages.'
              },
              {
                q: 'Do you offer refunds?',
                a: 'Yes, we offer a 30-day money-back guarantee on all paid plans.'
              },
              {
                q: 'Is there a setup fee?',
                a: 'No, there are no setup fees or hidden charges. Pay only for what you use.'
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Absolutely! Cancel your subscription anytime from your dashboard. No questions asked.'
              },
              {
                q: 'Do you offer discounts for nonprofits?',
                a: 'Yes! Contact us for special nonprofit pricing with up to 50% discount.'
              }
            ].map((faq, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Still have questions?</CardTitle>
            <CardDescription className="text-lg">
              Our team is here to help you choose the right plan
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  Contact Sales
                  <Users className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-rose-500 to-pink-600">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}