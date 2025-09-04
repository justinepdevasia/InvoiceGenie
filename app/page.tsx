import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Upload, FileText, Download, Zap, BarChart3, ArrowRight, Sparkles, Shield, Clock, Globe, Users, TrendingUp } from 'lucide-react'

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
              Invoice Genie
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
            Transform Your Invoices into
            <span className="block mt-2 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Structured Data Magic
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
            Upload any invoice format and watch as our AI instantly extracts, structures, and organizes your data. 
            No more manual entry. Just pure efficiency.
          </p>
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
        </div>
      </section>

      {/* Stats Section */}
      <section className="container py-16 border-y bg-gray-50/50 dark:bg-gray-900/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
              10M+
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Invoices Processed</div>
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

      {/* Features Section */}
      <section className="container py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to
              <span className="block text-gradient">Process Invoices at Scale</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-gray-100 dark:border-gray-800">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Multi-Format Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  PDFs, images, scanned docs, even photos. Our AI handles every format flawlessly.
                </p>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-gray-100 dark:border-gray-800">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Lightning Fast AI</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Our AI processes invoices in seconds with 99.9% accuracy guaranteed.
                </p>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-gray-100 dark:border-gray-800">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Smart Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Filter, search, and analyze your invoice data with powerful insights.
                </p>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-gray-100 dark:border-gray-800">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Download className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Instant Export</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Export to CSV, Excel, or integrate directly with your accounting software.
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
              How It Works
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              Three Simple Steps to
              <span className="block text-gradient">Invoice Freedom</span>
            </h2>
          </div>
          <div className="space-y-8">
            {[
              {
                number: "01",
                title: "Upload Your Invoices",
                description: "Drag and drop or select multiple invoices in any format. Our system handles bulk uploads seamlessly.",
                icon: Upload,
                color: "from-blue-500 to-cyan-500"
              },
              {
                number: "02", 
                title: "AI Magic Happens",
                description: "Our intelligent OCR extracts vendor details, line items, totals, dates, and more with incredible accuracy.",
                icon: Zap,
                color: "from-purple-500 to-pink-500"
              },
              {
                number: "03",
                title: "Export & Integrate",
                description: "Review, edit if needed, then export to CSV or connect directly to your accounting tools.",
                icon: Download,
                color: "from-green-500 to-emerald-500"
              }
            ].map((step) => (
              <div key={step.number} className="flex gap-6 items-start group">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform`}>
                      {step.number}
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                <div className="hidden md:block">
                  <step.icon className="h-8 w-8 text-gray-300 dark:text-gray-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-yellow-100 text-yellow-700 border-yellow-200">
              Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Start free, upgrade when you need more
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                name: "Free",
                price: "$0",
                description: "Perfect for trying out",
                features: ["10 pages/month", "1 project", "CSV export", "Email support"],
                highlighted: false
              },
              {
                name: "Starter",
                price: "$19",
                period: "/mo",
                description: "For small businesses",
                features: ["100 pages/month", "5 projects", "CSV export", "Priority support"],
                highlighted: false
              },
              {
                name: "Pro",
                price: "$49",
                period: "/mo",
                description: "For growing teams",
                features: ["500 pages/month", "Unlimited projects", "API access", "24/7 support", "Custom integrations"],
                highlighted: true,
                badge: "Most Popular"
              },
              {
                name: "Enterprise",
                price: "$149",
                period: "/mo",
                description: "For large organizations",
                features: ["2000 pages/month", "Unlimited everything", "Custom AI training", "Dedicated support", "SLA guarantee"],
                highlighted: false
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
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-gray-600 dark:text-gray-400">{plan.period}</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full mt-6 ${
                      plan.highlighted 
                        ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg' 
                        : ''
                    }`}
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container py-24 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
              Testimonials
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Loved by Finance Teams
              <span className="block text-gradient">Worldwide</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah Chen",
                role: "CFO at TechCorp",
                content: "Invoice Genie saved us 40 hours per week. The AI accuracy is mind-blowing!",
                rating: 5
              },
              {
                name: "Michael Rodriguez",
                role: "Accounting Manager",
                content: "We process 1000+ invoices monthly. This tool is a game-changer for our team.",
                rating: 5
              },
              {
                name: "Emma Thompson",
                role: "Startup Founder",
                content: "Perfect for small teams. The free tier is generous and the UI is beautiful.",
                rating: 5
              }
            ].map((testimonial) => (
              <Card key={testimonial.name} className="hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-yellow-500">★</span>
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 italic mb-4">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24">
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-950 dark:to-pink-950 rounded-3xl blur-3xl opacity-30"></div>
          </div>
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-rose-50 dark:from-gray-900 dark:to-gray-800">
            <CardHeader className="pb-8 pt-12">
              <Badge className="mx-auto mb-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white border-0">
                Limited Time Offer
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Ready to Transform Your
                <span className="block text-gradient">Invoice Processing?</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                Join 50,000+ businesses saving hours every week. Start with 10 free pages today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
                    Start Free Trial
                    <Sparkles className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                  Schedule Demo
                </Button>
              </div>
              <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                No credit card required • Setup in 2 minutes • Cancel anytime
              </p>
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
                  Invoice Genie
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Intelligent invoice processing powered by advanced AI. Making finance teams happier, one invoice at a time.
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
            <p>© 2024 Invoice Genie. All rights reserved. Made with ❤️ for finance teams everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}