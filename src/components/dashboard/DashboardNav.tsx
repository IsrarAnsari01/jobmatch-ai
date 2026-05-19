'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BrainCircuit, LayoutDashboard, LogOut, User, ChevronDown, Menu, X, Settings } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useState } from 'react'

interface DashboardNavProps {
  userEmail: string
  userName: string
}

export function DashboardNav({ userEmail, userName }: DashboardNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  const initials = userName
    ? userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail.slice(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <BrainCircuit className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm hidden sm:block">JobMatch AI</span>
        </Link>

        {/* Desktop nav — only Dashboard, no Profile */}
        <nav className="hidden sm:flex items-center gap-1 flex-1">
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'h-8 gap-1.5 text-sm',
              pathname === '/dashboard' ? 'bg-muted font-medium' : 'text-muted-foreground'
            )}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1">
          <ThemeToggle />

          {/* Desktop user dropdown */}
          <div className="hidden sm:block">
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-2 h-8 pr-2')}
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm max-w-[100px] truncate">{userName || userEmail}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                {/* User info */}
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold truncate">{userName || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                </div>
                <DropdownMenuSeparator />

                {/* Profile & Settings */}
                <DropdownMenuItem
                  onClick={() => router.push('/dashboard/profile')}
                  className="gap-2 cursor-pointer"
                >
                  <User className="h-3.5 w-3.5" />
                  Profile & Resume
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => router.push('/dashboard/profile')}
                  className="gap-2 cursor-pointer text-muted-foreground"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t bg-background px-4 py-3 space-y-1">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
              pathname === '/dashboard' ? 'bg-muted' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <LayoutDashboard className="h-4 w-4" />Dashboard
          </Link>

          <div className="border-t pt-2 mt-2 space-y-1">
            <div className="px-3 py-1.5">
              <p className="text-sm font-semibold">{userName || 'User'}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
            <Link
              href="/dashboard/profile"
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                pathname === '/dashboard/profile' ? 'bg-muted' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <User className="h-4 w-4" />Profile & Resume
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 w-full"
            >
              <LogOut className="h-4 w-4" />Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
