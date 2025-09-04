'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Sparkles, 
  Upload, 
  Zap, 
  Globe, 
  Shield, 
  BarChart3,
  Download,
  Search,
  Filter,
  Database,
  Code,
  Lock,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  Brain,
  Workflow,
  FileSearch,
  DollarSign,
  Languages,
  Cloud,
  Smartphone,
  Bot
} from 'lucide-react'

export default function FeaturesPage() {
  const [activeCategory, setActiveCategory] = useState('ocr')

  const featureCategories = {
    ocr: {
      title: 'OCR & AI Processing',
      icon: Brain,
      features: [
        {
          icon: Brain,
          title: 'Advanced AI OCR',
          description: 'State-of-the-art AI models extract data with 99.9% accuracy from any document format.',
          details: [
            'Multi-language support (35+ languages)',
            'Handwriting recognition',
            'Table extraction',
            'Automatic field detection'
          ]
        },
        {
          icon: FileSearch,
          title: 'Smart Data Extraction',
          description: 'Automatically identifies and extracts all invoice fields without manual configuration.',
          details: [
            'Vendor information detection',
            'Line item parsing',
            'Tax calculation verification',
            'Currency conversion'
          ]
        },
        {
          icon: Zap,
          title: 'Lightning Fast Processing',
          description: 'Process invoices in under 60 seconds, regardless of complexity or size.',
          details: [
            'Parallel processing',
            'Batch optimization',
            'Real-time updates',
            'Queue management'
          ]
        },
        {
          icon: Languages,
          title: 'Multi-Language Support',
          description: 'Process invoices in any language with automatic translation capabilities.',
          details: [
            '35+ supported languages',
            'Automatic language detection',
            'Cross-language search',
            'Unicode support'
          ]
        }
      ]
    },
    workflow: {
      title: 'Workflow & Automation',
      icon: Workflow,
      features: [
        {
          icon: Upload,
          title: 'Bulk Upload & Processing',
          description: 'Upload hundreds of invoices at once with drag-and-drop or API integration.',
          details: [
            'Multi-file selection',
            'Folder upload',
            'Email attachment import',
            'Cloud storage sync'
          ]
        },
        {
          icon: Bot,
          title: 'Automation Rules',
          description: 'Set up custom rules to automate repetitive tasks and workflows.',
          details: [
            'Auto-categorization',
            'Approval workflows',
            'Email notifications',
            'Custom triggers'
          ]
        },
        {
          icon: Workflow,
          title: 'Custom Workflows',
          description: 'Design approval chains and processing pipelines tailored to your needs.',
          details: [
            'Visual workflow builder',
            'Conditional routing',
            'Role-based approvals',
            'Deadline management'
          ]
        },
        {
          icon: Clock,
          title: 'Scheduled Processing',
          description: 'Schedule automatic processing of invoices at specific times.',
          details: [
            'Recurring schedules',
            'Time zone support',
            'Holiday calendars',
            'Batch scheduling'
          ]
        }
      ]
    },
    data: {
      title: 'Data Management',
      icon: Database,
      features: [
        {
          icon: Database,
          title: 'Centralized Database',
          description: 'All your invoice data in one secure, searchable location.',
          details: [
            'Full-text search',
            'Advanced filtering',
            'Custom fields',
            'Data validation'
          ]
        },
        {
          icon: Search,
          title: 'Smart Search & Filter',
          description: 'Find any invoice instantly with powerful search capabilities.',
          details: [
            'Natural language search',
            'Date range filtering',
            'Amount filtering',
            'Vendor search'
          ]
        },
        {
          icon: Download,
          title: 'Export & Integration',
          description: 'Export data in any format or integrate with your existing tools.',
          details: [
            'CSV/Excel export',
            'QuickBooks integration',
            'Xero sync',
            'Custom API endpoints'
          ]
        },
        {
          icon: BarChart3,
          title: 'Analytics & Reporting',
          description: 'Gain insights with comprehensive analytics and custom reports.',
          details: [
            'Spending trends',
            'Vendor analytics',
            'Tax summaries',
            'Custom dashboards'
          ]
        }
      ]
    },
    security: {
      title: 'Security & Compliance',
      icon: Shield,
      features: [
        {
          icon: Lock,
          title: 'Bank-Level Security',
          description: '256-bit encryption and secure infrastructure protect your data.',
          details: [
            'End-to-end encryption',
            'SSL/TLS protocols',
            'Regular security audits',
            'Penetration testing'
          ]
        },
        {
          icon: Shield,
          title: 'Compliance',
          description: 'Meet regulatory requirements with built-in compliance features.',
          details: [
            'GDPR compliant',
            'SOC2 certified',
            'HIPAA ready',
            'PCI DSS compliant'
          ]
        },
        {
          icon: Users,
          title: 'Access Control',
          description: 'Granular permissions and role-based access control.',
          details: [
            'User roles',
            'Department segregation',
            'Audit trails',
            'Two-factor authentication'
          ]
        },
        {
          icon: Cloud,
          title: 'Secure Cloud Storage',
          description: 'Your data is backed up and replicated across multiple locations.',
          details: [
            'Automatic backups',
            'Disaster recovery',
            'Data redundancy',
            '99.99% uptime SLA'
          ]
        }
      ]
    },
    integration: {
      title: 'Integration & API',
      icon: Code,
      features: [
        {
          icon: Code,
          title: 'RESTful API',
          description: 'Comprehensive API for seamless integration with your systems.',
          details: [
            'Full documentation',
            'SDKs available',
            'Webhook support',
            'Rate limiting'
          ]
        },
        {
          icon: DollarSign,
          title: 'Accounting Software',
          description: 'Direct integration with popular accounting platforms.',
          details: [
            'QuickBooks',
            'Xero',
            'SAP',
            'NetSuite'
          ]
        },
        {
          icon: Cloud,
          title: 'Cloud Storage',
          description: 'Sync with your preferred cloud storage provider.',
          details: [
            'Google Drive',
            'Dropbox',
            'OneDrive',
            'Box'
          ]
        },
        {
          icon: Smartphone,
          title: 'Mobile Apps',
          description: 'Process invoices on the go with mobile applications.',
          details: [
            'iOS app',
            'Android app',
            'Camera scanning',
            'Offline mode'
          ]
        }
      ]
    }
  }

  type CategoryKey = keyof typeof featureCategories

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative">
              <FileText className="h-8 w-8 text-rose-500" />
              <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
              Invoice Genie
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-rose-500 to-pink-600">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
            <Sparkles className="h-3 w-3 mr-1 inline" />
            Powerful Features
          </Badge>
          <h1 className="text-5xl font-bold mb-4">
            Everything You Need to
            <span className="block text-gradient">Process Invoices Like Magic</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            From AI-powered OCR to seamless integrations, discover all the features that make 
            Invoice Genie the most powerful invoice processing platform.
          </p>
        </div>

        {/* Feature Categories Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-12">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
            {Object.entries(featureCategories).map(([key, category]) => {
              const Icon = category.icon
              return (
                <TabsTrigger key={key} value={key} className="flex flex-col gap-1 py-3">
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{category.title}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {Object.entries(featureCategories).map(([key, category]) => (
            <TabsContent key={key} value={key} className="mt-8">
              <div className="grid md:grid-cols-2 gap-6">
                {category.features.map((feature, idx) => {
                  const FeatureIcon = feature.icon
                  return (
                    <Card key={idx} className="hover:shadow-xl transition-all">
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                            <FeatureIcon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-grow">
                            <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                            <CardDescription>{feature.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {feature.details.map((detail, detailIdx) => (
                            <li key={detailIdx} className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Comparison Table */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">How We Compare</CardTitle>
            <CardDescription>
              See how Invoice Genie stacks up against traditional methods and competitors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Feature</th>
                    <th className="text-center py-3 px-4">Manual Entry</th>
                    <th className="text-center py-3 px-4">Basic OCR</th>
                    <th className="text-center py-3 px-4 bg-rose-50 dark:bg-rose-950/20">Invoice Genie</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Processing Time', manual: '10-15 min', basic: '2-5 min', genie: '<60 sec' },
                    { feature: 'Accuracy', manual: '85-90%', basic: '92-95%', genie: '99.9%' },
                    { feature: 'Multi-format Support', manual: '❌', basic: 'Limited', genie: '✅ All formats' },
                    { feature: 'Line Item Extraction', manual: 'Manual', basic: '❌', genie: '✅ Automatic' },
                    { feature: 'Multi-language', manual: '❌', basic: '❌', genie: '✅ 35+ languages' },
                    { feature: 'API Integration', manual: '❌', basic: 'Limited', genie: '✅ Full API' },
                    { feature: 'Bulk Processing', manual: '❌', basic: 'Basic', genie: '✅ Advanced' },
                    { feature: 'Cost per Invoice', manual: '$5-10', basic: '$2-3', genie: '$0.10-0.50' },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-3 px-4 font-medium">{row.feature}</td>
                      <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">{row.manual}</td>
                      <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">{row.basic}</td>
                      <td className="text-center py-3 px-4 bg-rose-50 dark:bg-rose-950/20 font-semibold">{row.genie}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Use Cases */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Perfect For Every Business</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Small Businesses',
                description: 'Streamline your bookkeeping and save hours every week',
                icon: Smartphone,
                benefits: ['Affordable pricing', 'Easy setup', 'No training required']
              },
              {
                title: 'Accounting Firms',
                description: 'Process client invoices faster and more accurately',
                icon: BarChart3,
                benefits: ['Multi-client support', 'Bulk processing', 'White-label options']
              },
              {
                title: 'Enterprise',
                description: 'Scale invoice processing across your entire organization',
                icon: Globe,
                benefits: ['Custom workflows', 'API integration', 'Dedicated support']
              }
            ].map((useCase, idx) => {
              const Icon = useCase.icon
              return (
                <Card key={idx} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Icon className="h-12 w-12 text-rose-500 mb-4" />
                    <CardTitle>{useCase.title}</CardTitle>
                    <CardDescription>{useCase.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {useCase.benefits.map((benefit, benefitIdx) => (
                        <li key={benefitIdx} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <Card className="border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Experience the Magic Yourself</CardTitle>
            <CardDescription className="text-lg">
              Start processing invoices with AI-powered accuracy today
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex gap-4 justify-center mb-6">
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-rose-500 to-pink-600">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  Request Demo
                  <Users className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Free tier includes 10 pages/month • No credit card required
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}