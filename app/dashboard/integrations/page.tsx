'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building,
  Download,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  FileDown,
  Settings,
  Plug,
  ExternalLink
} from 'lucide-react'

interface IntegrationSettings {
  quickbooks: boolean
  xero: boolean
  sage: boolean
  freshbooks: boolean
  wave: boolean
  zohobooks: boolean
  salesforce: boolean
}

const integrations = [
  {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    description: 'Sync invoices directly with QuickBooks Online',
    color: 'text-green-600',
    features: ['Auto-sync invoices', 'Match vendors', 'Export line items', 'Tax mapping'],
    status: 'available'
  },
  {
    id: 'xero',
    name: 'Xero',
    description: 'Import invoices into Xero accounting',
    color: 'text-blue-600',
    features: ['Bulk import', 'Supplier matching', 'Multi-currency', 'Attachment sync'],
    status: 'available'
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Export data in Sage-compatible format',
    color: 'text-red-600',
    features: ['CSV export', 'Custom field mapping', 'Batch processing'],
    status: 'csv-only'
  },
  {
    id: 'freshbooks',
    name: 'FreshBooks',
    description: 'Streamline invoice processing with FreshBooks',
    color: 'text-orange-600',
    features: ['Expense tracking', 'Client management', 'Project linking'],
    status: 'csv-only'
  },
  {
    id: 'wave',
    name: 'Wave',
    description: 'Free accounting software integration',
    color: 'text-cyan-600',
    features: ['Free integration', 'Receipt scanning', 'Invoice matching'],
    status: 'csv-only'
  },
  {
    id: 'zohobooks',
    name: 'Zoho Books',
    description: 'Complete accounting automation with Zoho',
    color: 'text-yellow-600',
    features: ['Workflow automation', 'Multi-branch', 'GST compliance'],
    status: 'csv-only'
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Sync invoice data with Salesforce CRM',
    color: 'text-sky-600',
    features: ['Vendor management', 'Custom objects', 'Document attachments', 'Financial tracking'],
    status: 'available'
  }
]

export default function IntegrationsPage() {
  const [settings, setSettings] = useState<IntegrationSettings>({
    quickbooks: false,
    xero: false,
    sage: false,
    freshbooks: false,
    wave: false,
    zohobooks: false,
    salesforce: false
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    fetchIntegrationSettings()
  }, [])

  const fetchIntegrationSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (userSettings) {
        setSettings({
          quickbooks: userSettings.quickbooks_enabled ?? false,
          xero: userSettings.xero_enabled ?? false,
          sage: userSettings.sage_enabled ?? false,
          freshbooks: userSettings.freshbooks_enabled ?? false,
          wave: userSettings.wave_enabled ?? false,
          zohobooks: userSettings.zohobooks_enabled ?? false,
          salesforce: userSettings.salesforce_enabled ?? false
        })
      }
    } catch (error) {
      console.error('Error fetching integration settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (integration: string, enabled: boolean) => {
    setSettings(prev => ({ ...prev, [integration]: enabled }))
    
    // Here you would save to database
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          [`${integration}_enabled`]: enabled,
          updated_at: new Date().toISOString()
        })
    }
  }

  const handleConnect = (integrationId: string) => {
    // In a real app, this would initiate OAuth flow
    alert(`Connecting to ${integrationId}... This feature will be available soon!`)
  }

  const handleExportTemplate = (integrationId: string) => {
    // Generate CSV template for the specific platform
    alert(`Downloading ${integrationId} CSV template...`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect Invoice Genie with your accounting software to automate data transfer
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Integrations</TabsTrigger>
          <TabsTrigger value="connected">Connected</TabsTrigger>
          <TabsTrigger value="csv">CSV Export</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {integrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Building className={`h-8 w-8 ${integration.color}`} />
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {integration.description}
                        </CardDescription>
                      </div>
                    </div>
                    {settings[integration.id as keyof IntegrationSettings] && (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {integration.features.map((feature, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    {integration.status === 'available' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={settings[integration.id as keyof IntegrationSettings]}
                            onCheckedChange={(checked) => handleToggle(integration.id, checked)}
                          />
                          <span className="text-sm">
                            {settings[integration.id as keyof IntegrationSettings] ? 'Connected' : 'Disabled'}
                          </span>
                        </div>
                        {!settings[integration.id as keyof IntegrationSettings] && (
                          <Button 
                            size="sm" 
                            onClick={() => handleConnect(integration.id)}
                          >
                            Connect
                            <ExternalLink className="h-3 w-3 ml-2" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <Badge variant="outline">CSV Export Only</Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleExportTemplate(integration.id)}
                        >
                          <FileDown className="h-3 w-3 mr-2" />
                          Get Template
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="connected" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {integrations
              .filter(i => settings[i.id as keyof IntegrationSettings])
              .map((integration) => (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Building className={`h-8 w-8 ${integration.color}`} />
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            Connected and active
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm">
                        <Settings className="h-3 w-3 mr-2" />
                        Configure
                      </Button>
                      <Switch
                        checked={true}
                        onCheckedChange={(checked) => handleToggle(integration.id, checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
          {!integrations.some(i => settings[i.id as keyof IntegrationSettings]) && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Plug className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Connected Integrations</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Connect your accounting software to start syncing invoice data automatically
                </p>
                <Button onClick={() => setActiveTab('all')}>
                  Browse Integrations
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="csv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CSV Export Templates</CardTitle>
              <CardDescription>
                Download pre-formatted CSV templates for easy import into your accounting software
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {integrations.map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building className={`h-5 w-5 ${integration.color}`} />
                    <div>
                      <p className="font-medium">{integration.name} Template</p>
                      <p className="text-sm text-muted-foreground">
                        Formatted for {integration.name} import
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExportTemplate(integration.id)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How CSV Export Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Select Your Invoices</p>
                    <p className="text-sm text-muted-foreground">Choose which invoices to export from your projects</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Choose Export Format</p>
                    <p className="text-sm text-muted-foreground">Select the template that matches your accounting software</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Import to Your Software</p>
                    <p className="text-sm text-muted-foreground">Use the CSV import feature in your accounting platform</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}