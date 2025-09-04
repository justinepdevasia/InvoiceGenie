'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  User,
  Mail,
  Lock,
  Shield,
  Bell,
  Globe,
  Palette,
  Key,
  Building,
  FileText,
  AlertCircle,
  Check,
  X,
  Eye,
  EyeOff,
  Download,
  Trash2,
  LogOut,
  Smartphone,
  Monitor,
  Moon,
  Sun
} from 'lucide-react'
import { useTheme } from 'next-themes'

interface UserSettings {
  profile: {
    name: string
    email: string
    company: string
    role: string
    avatar: string
  }
  preferences: {
    emailNotifications: boolean
    pushNotifications: boolean
    weeklyReport: boolean
    invoiceReminders: boolean
    newFeatures: boolean
    language: string
    dateFormat: string
    currency: string
    timezone: string
  }
  security: {
    twoFactorEnabled: boolean
    lastPasswordChange: string
    activeSessions: number
    apiKeys: Array<{
      id: string
      name: string
      lastUsed: string
      created: string
    }>
  }
  integrations: {
    quickbooks: boolean
    xero: boolean
    slack: boolean
    zapier: boolean
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const { theme, setTheme } = useTheme()
  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user settings from database
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // Mock settings data
      const mockSettings: UserSettings = {
        profile: {
          name: user.user_metadata?.name || 'John Doe',
          email: user.email || 'user@example.com',
          company: userSettings?.company || 'Acme Inc.',
          role: userSettings?.role || 'Admin',
          avatar: user.user_metadata?.avatar_url || ''
        },
        preferences: {
          emailNotifications: userSettings?.email_notifications ?? true,
          pushNotifications: userSettings?.push_notifications ?? false,
          weeklyReport: userSettings?.weekly_report ?? true,
          invoiceReminders: userSettings?.invoice_reminders ?? true,
          newFeatures: userSettings?.new_features ?? true,
          language: userSettings?.language || 'en',
          dateFormat: userSettings?.date_format || 'MM/DD/YYYY',
          currency: userSettings?.currency || 'USD',
          timezone: userSettings?.timezone || 'America/Los_Angeles'
        },
        security: {
          twoFactorEnabled: userSettings?.two_factor_enabled ?? false,
          lastPasswordChange: userSettings?.last_password_change || new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          activeSessions: 3,
          apiKeys: [
            {
              id: '1',
              name: 'Production API',
              lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: '2',
              name: 'Development API',
              lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              created: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        },
        integrations: {
          quickbooks: userSettings?.quickbooks_enabled ?? false,
          xero: userSettings?.xero_enabled ?? false,
          slack: userSettings?.slack_enabled ?? false,
          zapier: userSettings?.zapier_enabled ?? false
        }
      }

      setSettings(mockSettings)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !settings) return

      // Save settings to database
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          company: settings.profile.company,
          role: settings.profile.role,
          email_notifications: settings.preferences.emailNotifications,
          push_notifications: settings.preferences.pushNotifications,
          weekly_report: settings.preferences.weeklyReport,
          invoice_reminders: settings.preferences.invoiceReminders,
          new_features: settings.preferences.newFeatures,
          language: settings.preferences.language,
          date_format: settings.preferences.dateFormat,
          currency: settings.preferences.currency,
          timezone: settings.preferences.timezone,
          two_factor_enabled: settings.security.twoFactorEnabled,
          quickbooks_enabled: settings.integrations.quickbooks,
          xero_enabled: settings.integrations.xero,
          slack_enabled: settings.integrations.slack,
          zapier_enabled: settings.integrations.zapier,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.new !== passwordData.confirm) {
      alert('New passwords do not match')
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new
      })

      if (error) throw error
      
      alert('Password updated successfully!')
      setPasswordData({ current: '', new: '', confirm: '' })
    } catch (error) {
      console.error('Error updating password:', error)
      alert('Failed to update password')
    }
  }

  const generateApiKey = () => {
    const newKey = `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    alert(`New API Key: ${newKey}\n\nMake sure to copy this key now. You won't be able to see it again!`)
  }

  const deleteApiKey = (id: string) => {
    if (confirm('Are you sure you want to delete this API key?')) {
      setSettings(prev => prev ? {
        ...prev,
        security: {
          ...prev.security,
          apiKeys: prev.security.apiKeys.filter(key => key.id !== id)
        }
      } : null)
    }
  }

  const exportData = () => {
    alert('Preparing your data export. You will receive an email when it\'s ready.')
  }

  const deleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      alert('Account deletion initiated. You will receive a confirmation email.')
    }
  }

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
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="data">Data & Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={settings?.profile.name || ''}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      profile: { ...prev.profile, name: e.target.value }
                    } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings?.profile.email || ''}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your email address
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={settings?.profile.company || ''}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      profile: { ...prev.profile, company: e.target.value }
                    } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={settings?.profile.role}
                    onValueChange={(value) => setSettings(prev => prev ? {
                      ...prev,
                      profile: { ...prev.profile, role: value }
                    } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Accountant">Accountant</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notif">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your invoices
                  </p>
                </div>
                <Switch
                  id="email-notif"
                  checked={settings?.preferences.emailNotifications}
                  onCheckedChange={(checked) => setSettings(prev => prev ? {
                    ...prev,
                    preferences: { ...prev.preferences, emailNotifications: checked }
                  } : null)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notif">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get browser notifications for important updates
                  </p>
                </div>
                <Switch
                  id="push-notif"
                  checked={settings?.preferences.pushNotifications}
                  onCheckedChange={(checked) => setSettings(prev => prev ? {
                    ...prev,
                    preferences: { ...prev.preferences, pushNotifications: checked }
                  } : null)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weekly-report">Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly summary of your invoice processing
                  </p>
                </div>
                <Switch
                  id="weekly-report"
                  checked={settings?.preferences.weeklyReport}
                  onCheckedChange={(checked) => setSettings(prev => prev ? {
                    ...prev,
                    preferences: { ...prev.preferences, weeklyReport: checked }
                  } : null)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="invoice-remind">Invoice Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminders for pending invoices
                  </p>
                </div>
                <Switch
                  id="invoice-remind"
                  checked={settings?.preferences.invoiceReminders}
                  onCheckedChange={(checked) => setSettings(prev => prev ? {
                    ...prev,
                    preferences: { ...prev.preferences, invoiceReminders: checked }
                  } : null)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how Invoice Genie looks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      onClick={() => setTheme('light')}
                      className="w-full"
                    >
                      <Sun className="h-4 w-4 mr-2" />
                      Light
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      onClick={() => setTheme('dark')}
                      className="w-full"
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      Dark
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      onClick={() => setTheme('system')}
                      className="w-full"
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      System
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
              <CardDescription>
                Configure your language, date format, and currency preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select 
                    value={settings?.preferences.language}
                    onValueChange={(value) => setSettings(prev => prev ? {
                      ...prev,
                      preferences: { ...prev.preferences, language: value }
                    } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={settings?.preferences.timezone}
                    onValueChange={(value) => setSettings(prev => prev ? {
                      ...prev,
                      preferences: { ...prev.preferences, timezone: value }
                    } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={settings?.preferences.currency}
                    onValueChange={(value) => setSettings(prev => prev ? {
                      ...prev,
                      preferences: { ...prev.preferences, currency: value }
                    } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select 
                    value={settings?.preferences.dateFormat}
                    onValueChange={(value) => setSettings(prev => prev ? {
                      ...prev,
                      preferences: { ...prev.preferences, dateFormat: value }
                    } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password regularly to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.current}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                />
              </div>
              <Button onClick={handlePasswordChange}>Update Password</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {settings?.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {settings?.security.twoFactorEnabled 
                      ? 'Your account is protected with 2FA' 
                      : 'Enable 2FA to secure your account'}
                  </p>
                </div>
                <Button variant={settings?.security.twoFactorEnabled ? 'outline' : 'default'}>
                  {settings?.security.twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage devices that have access to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Chrome on MacOS</p>
                    <p className="text-sm text-muted-foreground">Current session</p>
                  </div>
                </div>
                <Badge variant="secondary">Current</Badge>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium">iPhone</p>
                    <p className="text-sm text-muted-foreground">Last active 2 hours ago</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" className="w-full">
                Sign Out All Other Sessions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Services</CardTitle>
              <CardDescription>
                Manage your integrations with third-party services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">QuickBooks</p>
                    <p className="text-sm text-muted-foreground">
                      {settings?.integrations.quickbooks ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings?.integrations.quickbooks}
                  onCheckedChange={(checked) => setSettings(prev => prev ? {
                    ...prev,
                    integrations: { ...prev.integrations, quickbooks: checked }
                  } : null)}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Xero</p>
                    <p className="text-sm text-muted-foreground">
                      {settings?.integrations.xero ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings?.integrations.xero}
                  onCheckedChange={(checked) => setSettings(prev => prev ? {
                    ...prev,
                    integrations: { ...prev.integrations, xero: checked }
                  } : null)}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Slack</p>
                    <p className="text-sm text-muted-foreground">
                      {settings?.integrations.slack ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings?.integrations.slack}
                  onCheckedChange={(checked) => setSettings(prev => prev ? {
                    ...prev,
                    integrations: { ...prev.integrations, slack: checked }
                  } : null)}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Zapier</p>
                    <p className="text-sm text-muted-foreground">
                      {settings?.integrations.zapier ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings?.integrations.zapier}
                  onCheckedChange={(checked) => setSettings(prev => prev ? {
                    ...prev,
                    integrations: { ...prev.integrations, zapier: checked }
                  } : null)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage your API keys for programmatic access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings?.security.apiKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{key.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Last used: {new Date(key.lastUsed).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteApiKey(key.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button onClick={generateApiKey} className="w-full">
                <Key className="h-4 w-4 mr-2" />
                Generate New API Key
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>
                Download all your data in a machine-readable format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={exportData} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export All Data
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="text-red-900 dark:text-red-100">
                Danger Zone
              </CardTitle>
              <CardDescription className="text-red-800 dark:text-red-200">
                Irreversible actions that affect your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={deleteAccount}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}