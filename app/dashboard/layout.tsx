'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { FileText, Home, FolderOpen, CreditCard, Settings, LogOut, Menu, FileStack, User } from 'lucide-react'
import { AuthGuard } from '@/components/auth/auth-guard'

const sidebarItems = [
  { href: '/dashboard', icon: Home, label: 'Overview' },
  { href: '/dashboard/projects', icon: FolderOpen, label: 'Projects' },
  { href: '/dashboard/invoices', icon: FileStack, label: 'Documents' },
  { href: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const Sidebar = () => (
    <div className="h-full bg-muted/50">
      <div className="flex h-16 items-center gap-2 px-6 border-b">
        <FileText className="h-6 w-6 text-primary" />
        <span className="font-bold text-xl">Expensa</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )

  return (
    <AuthGuard>
      <div className="min-h-screen flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 border-r">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <div className="flex-1 md:ml-64">
          {/* Top Bar */}
          <header className="sticky top-0 z-40 border-b bg-background">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center gap-4">
                {/* Mobile Menu */}
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild className="md:hidden">
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-0">
                    <Sidebar />
                  </SheetContent>
                </Sheet>
                <h1 className="text-lg font-semibold">Dashboard</h1>
              </div>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/billing">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Billing
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </div>
      </AuthGuard>
    )
  }