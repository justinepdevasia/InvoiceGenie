import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { CheckCircle, Upload, FileText, Download, Zap, BarChart3, ArrowRight, Sparkles, Shield, Clock, Globe, Users, TrendingUp, Star, DollarSign, FileX, Target, Workflow, Database, HelpCircle } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white via-rose-50/20 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <FileText className="h-8 w-8 text-rose-500" />
              <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
              Expensa
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/api-docs">
              <Button variant="ghost" className="hover:text-rose-500 transition-colors">
                API Docs
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" className="hover:text-rose-500 transition-colors">
                Pricing
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="hover:text-rose-500 transition-colors">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative container py-24 md:py-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>

        <div className="mx-auto max-w-5xl text-center relative">
          <Badge className="mb-4 bg-rose-100 text-rose-700 border-rose-200 px-4 py-1">
            <Sparkles className="h-3 w-3 mr-1 inline" />
            Powered by Advanced AI
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Stop Wasting Hours on
            <span className="block mt-2 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Manual Expense Processing
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
            Turn any expense document into structured data in seconds. Our AI reads invoices, receipts, and bills with 99.9% accuracy -
            <strong className="text-gray-900 dark:text-white"> so you can focus on what matters: growing your business.</strong>
          </p>

          {/* Problem/Solution indicator */}
          <div className="mt-8 flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2 text-red-600">
              <FileX className="h-5 w-5" />
              <span>Manual data entry</span>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
            <div className="flex items-center gap-2 text-green-600">
              <Zap className="h-5 w-5" />
              <span>AI automation in 60s</span>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
                <Zap className="mr-2 h-5 w-5" />
                Start Free - 10 Pages
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all">
                Watch Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <span>SOC2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span>60s Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-500" />
              <span>35+ Languages</span>
            </div>
          </div>

          {/* Product video/screenshot placeholder */}
          <div className="mt-12">
            <div className="relative mx-auto max-w-4xl">
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <div className="h-16 w-16 mx-auto mb-4 bg-rose-100 dark:bg-rose-900 rounded-full flex items-center justify-center">
                    <FileText className="h-8 w-8 text-rose-500" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Product Demo Video</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">See Expensa in action</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners/Social Proof Section */}
      <section className="container py-16 border-b bg-gray-50/50 dark:bg-gray-900/50">
        <div className="text-center mb-12">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">Trusted by companies all</p>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center opacity-60">
            {[
              "Microsoft", "Shopify", "Stripe", "Slack", "Notion", "Figma"
            ].map((company) => (
              <div key={company} className="text-center">
                <div className="h-8 w-20 bg-gray-300 dark:bg-gray-600 rounded-md mx-auto flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{company}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
              10M+
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Documents Processed</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
              99.9%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Accuracy Rate</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
              50K+
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Happy Users</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
              24/7
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Support Available</div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
              Benefits
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Focus on how it helps
              <span className="block text-gradient">user instead of what features it has</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-gray-100 dark:border-gray-800">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Save 40+ Hours Per Month</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Stop manually entering expense data. Our AI does it instantly, freeing your team to focus on strategic financial decisions instead of data entry.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-gray-100 dark:border-gray-800">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">99.9% Accuracy Guaranteed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Eliminate human errors and inconsistencies. Our AI reads documents more accurately than manual entry, ensuring your financial records are perfect.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-gray-100 dark:border-gray-800">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Workflow className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Seamless Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Connect directly with QuickBooks, Xero, and other accounting tools. No more switching between platforms or importing/exporting files.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-gray-100 dark:border-gray-800">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Process Any Document Type</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  PDFs, photos, scanned docs, receipts, invoices, bills - upload anything. Never worry about format compatibility again.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-gray-100 dark:border-gray-800">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Organized & Searchable</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All your expense data becomes instantly searchable and filterable. Find any transaction or vendor in seconds, not hours.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-gray-100 dark:border-gray-800">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Scale Without Hiring</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Handle 10x more expense documents without adding staff. Perfect for growing businesses that need to scale their finance operations efficiently.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-700 border-green-200">
              How it works?
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              Explain how to get started with the
              <span className="block text-gradient">product in 3 simple steps</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: "1",
                title: "Upload Documents",
                description: "Drag & drop your expense documents - invoices, receipts, bills in any format (PDF, JPG, PNG). Bulk upload supported for faster processing.",
                icon: Upload,
                color: "from-blue-500 to-cyan-500"
              },
              {
                number: "2",
                title: "AI Processing",
                description: "Our advanced AI instantly reads and extracts all data: vendor names, amounts, dates, line items, taxes. 99.9% accuracy guaranteed in under 60 seconds.",
                icon: Zap,
                color: "from-purple-500 to-pink-500"
              },
              {
                number: "3",
                title: "Export & Use",
                description: "Review extracted data, make any edits, then export to CSV/Excel or sync directly with QuickBooks, Xero, and other accounting platforms.",
                icon: Download,
                color: "from-green-500 to-emerald-500"
              }
            ].map((step) => (
              <Card key={step.number} className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 text-center">
                <CardHeader>
                  <div className="mx-auto mb-4">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                      {step.number}
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                  <div className="mt-6">
                    <step.icon className={`h-8 w-8 mx-auto text-gray-400 group-hover:text-${step.color.split('-')[1]}-500 transition-colors`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call to action for this section */}
          <div className="text-center mt-12">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all">
                Try It Now - Start Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-yellow-100 text-yellow-700 border-yellow-200">
              Pricing - Why to buy/How it helps
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Plans difference in plans. Don't hide anything
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Add CTAs for all plans
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-500 mt-2">
              Highlight the middle plan, guide users to see other people happy with their purchase
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Starter",
                price: "$100",
                period: "/month",
                description: "Perfect for small teams starting out",
                features: [
                  "Up to 500 documents/month",
                  "Basic OCR processing",
                  "CSV export",
                  "Email support",
                  "1 integration",
                  "Standard processing speed"
                ],
                highlighted: false,
                cta: "Start Free Trial",
                note: "No credit card required"
              },
              {
                name: "Pro",
                price: "$200",
                period: "/month",
                description: "Best for growing businesses",
                features: [
                  "Up to 2,000 documents/month",
                  "Advanced AI processing",
                  "Multiple export formats",
                  "Priority support",
                  "Unlimited integrations",
                  "Fast processing",
                  "Custom workflows",
                  "Advanced analytics"
                ],
                highlighted: true,
                badge: "Most Popular",
                cta: "Get Started",
                note: "Most teams choose this plan"
              },
              {
                name: "Advanced",
                price: "$300",
                period: "/month",
                description: "For enterprise-scale operations",
                features: [
                  "Unlimited documents",
                  "Enterprise AI processing",
                  "White-label solution",
                  "Dedicated support",
                  "Custom integrations",
                  "Instant processing",
                  "Advanced security",
                  "Custom AI training",
                  "SLA guarantee"
                ],
                highlighted: false,
                cta: "Contact Sales",
                note: "Custom enterprise pricing available"
              }
            ].map((plan) => (
              <Card
                key={plan.name}
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
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                  <div className="mt-6">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-gray-600 dark:text-gray-400 text-lg">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg text-lg py-3'
                        : 'text-lg py-3'
                    }`}
                    variant={plan.highlighted ? "default" : "outline"}
                    size="lg"
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                    {plan.note}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pricing FAQ */}
          <div className="mt-16 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              All plans include: 99.9% accuracy guarantee • 60-second processing • SOC2 compliance • 30-day money-back guarantee
            </p>
            <div className="flex justify-center gap-6 text-sm text-gray-500">
              <span>✓ No setup fees</span>
              <span>✓ Cancel anytime</span>
              <span>✓ Free migration help</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container py-24 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
              Loved by people worldwide
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Hear it from our customers instead
              <span className="block text-gradient">of our own pricing to help with conversions</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              People feel relieved to see other people happy with their purchase.
              The more testimonials, the better
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "CFO at TechCorp",
                company: "TechCorp",
                content: "Expensa saved us 40+ hours per week on expense processing. Our team went from drowning in paperwork to focusing on strategic financial planning. The ROI was immediate.",
                rating: 5,
                image: "SC"
              },
              {
                name: "Michael Rodriguez",
                role: "Finance Manager",
                company: "GrowthCo",
                content: "We process 1000+ expense documents monthly. Before Expensa, it took our team 3 days. Now it's done in 2 hours with higher accuracy. Absolute game-changer.",
                rating: 5,
                image: "MR"
              },
              {
                name: "Emma Thompson",
                role: "Startup Founder",
                company: "InnovateLabs",
                content: "As a small startup, every hour counts. Expensa's free tier got us started, and the Pro plan scales perfectly with our growth. The UI is intuitive and beautiful.",
                rating: 5,
                image: "ET"
              },
              {
                name: "David Kim",
                role: "Accounting Director",
                company: "RetailPlus",
                content: "The AI accuracy is phenomenal. 99.9% precision means we rarely need to manually correct anything. Our month-end close is now 50% faster.",
                rating: 5,
                image: "DK"
              },
              {
                name: "Lisa Garcia",
                role: "Operations Manager",
                company: "ServicePro",
                content: "Integration with QuickBooks was seamless. Our accountant loves how clean and organized the data imports are. Saved us thousands in bookkeeping fees.",
                rating: 5,
                image: "LG"
              },
              {
                name: "James Wilson",
                role: "Finance VP",
                company: "ScaleCorp",
                content: "Best investment we've made for our finance department. The support team is incredibly responsive and the product keeps getting better with new features.",
                rating: 5,
                image: "JW"
              }
            ].map((testimonial) => (
              <Card key={testimonial.name} className="hover:shadow-xl transition-all group">
                <CardHeader>
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 italic mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {testimonial.image}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{testimonial.company}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Additional social proof */}
          <div className="mt-16 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-yellow-500 fill-current" />
                ))}
              </div>
              <span className="text-xl font-semibold">4.9/5</span>
              <span className="text-gray-600 dark:text-gray-400">from 2,847+ reviews</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Join thousands of finance teams already saving 40+ hours per week
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container py-24">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gray-100 text-gray-700 border-gray-200">
              Frequently Asked Questions
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Address some major questions to help
              <span className="block text-gradient">people make the final call</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              E.g. Cancellation/Refunds related questions
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            {[
              {
                question: "How accurate is the AI processing?",
                answer: "Our AI maintains 99.9% accuracy across all document types. We use advanced machine learning models trained on millions of expense documents. If any errors occur, our system flags them for review, and we continuously improve accuracy based on feedback."
              },
              {
                question: "What file formats do you support?",
                answer: "We support all major formats including PDF, JPG, PNG, TIFF, and even smartphone photos. Whether it's a scanned receipt, digital invoice, or photo taken on your phone - our AI can process it accurately."
              },
              {
                question: "How secure is my financial data?",
                answer: "Security is our top priority. We're SOC2 Type II compliant, use enterprise-grade encryption (AES-256), and never store your original documents longer than necessary. All data is processed in secure, isolated environments with strict access controls."
              },
              {
                question: "Can I cancel anytime? What about refunds?",
                answer: "Yes, you can cancel your subscription anytime with no questions asked. We offer a 30-day money-back guarantee for all paid plans. If you're not completely satisfied, we'll refund your entire payment within 30 days of purchase."
              },
              {
                question: "Do you integrate with my accounting software?",
                answer: "Yes! We integrate seamlessly with QuickBooks, Xero, FreshBooks, Sage, and many other popular accounting platforms. We also provide CSV/Excel export and a robust API for custom integrations."
              },
              {
                question: "What happens if I exceed my monthly limit?",
                answer: "If you exceed your plan's document limit, we'll notify you and temporarily pause processing. You can either upgrade your plan or wait until the next billing cycle. We never delete your data or charge overage fees without permission."
              },
              {
                question: "How long does processing take?",
                answer: "Most documents are processed in under 60 seconds. Complex multi-page documents may take up to 2-3 minutes. You'll receive real-time updates and can review results as soon as processing completes."
              },
              {
                question: "Do you offer customer support?",
                answer: "Absolutely! We provide email support for all users, priority support for paid plans, and 24/7 live chat for Pro and Enterprise customers. Our team typically responds within 2 hours during business hours."
              },
              {
                question: "Can I try before purchasing?",
                answer: "Yes! Our free plan includes 10 pages per month with no credit card required. You can test our full feature set and see the quality of our AI processing before deciding to upgrade."
              },
              {
                question: "What if I need to process more documents than the Enterprise plan allows?",
                answer: "For high-volume customers, we offer custom enterprise solutions with unlimited processing, dedicated infrastructure, and volume discounts. Contact our sales team to discuss your specific needs."
              }
            ].map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-gray-200 dark:border-gray-700 rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-semibold flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-400 pt-2 pb-4 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Contact support CTA */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Still have questions? We're here to help!
            </p>
            <Button variant="outline" size="lg" className="border-2 hover:border-rose-300">
              Contact Support Team
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24">
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-950 dark:to-pink-950 rounded-3xl blur-3xl opacity-30"></div>
          </div>
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-rose-50 dark:from-gray-900 dark:to-gray-800">
            <CardHeader className="pb-8 pt-12">
              <Badge className="mx-auto mb-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white border-0">
                CTA Section
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Highlight it, make it stand out
                <span className="block text-gradient">Let people know they're buying</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
                Stop wasting 40+ hours per month on manual expense processing. Join 50,000+ finance teams who've already made the switch to AI-powered automation.
              </p>

              {/* Value highlights */}
              <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-rose-500 mb-1">99.9%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-rose-500 mb-1">60s</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Processing Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-rose-500 mb-1">40hrs</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Saved Per Month</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link href="/signup">
                  <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
                    <Zap className="mr-2 h-5 w-5" />
                    Start Free - Process 10 Documents Now
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <Users className="mr-2 h-5 w-5" />
                    Book Enterprise Demo
                  </Button>
                </Link>
              </div>

              {/* Trust signals */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Setup in 2 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>30-day money-back guarantee</span>
                </div>
              </div>

              {/* Urgency/scarcity */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  🔥 Limited Time: Free migration from your current system included
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Offer expires in 7 days • No additional fees
                </p>
              </div>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative">
                  <FileText className="h-8 w-8 text-rose-500" />
                  <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
                  Expensa
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Intelligent expense document processing powered by advanced AI. Making finance teams happier, one document at a time.
              </p>
              <div className="flex gap-4 mt-4">
                {/* Social icons could go here */}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/features" className="hover:text-rose-500 transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-rose-500 transition-colors">Pricing</Link></li>
                <li><Link href="/api-docs" className="hover:text-rose-500 transition-colors">API Docs</Link></li>
                <li><Link href="/integrations" className="hover:text-rose-500 transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/about" className="hover:text-rose-500 transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-rose-500 transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-rose-500 transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-rose-500 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/privacy" className="hover:text-rose-500 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-rose-500 transition-colors">Terms of Service</Link></li>
                <li><Link href="/security" className="hover:text-rose-500 transition-colors">Security</Link></li>
                <li><Link href="/gdpr" className="hover:text-rose-500 transition-colors">GDPR</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600 dark:text-gray-400">
            <p>© 2024 Expensa. All rights reserved. Made with ❤️ for finance teams everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}