'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { signOut } from 'next-auth/react'
import {
  Bell,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TopHeaderProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  onMenuToggle: () => void
}

function getUserInitials(user: TopHeaderProps['user']): string {
  if (user.name) {
    const parts = user.name.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    if (parts.length > 0 && parts[0].length > 0) {
      return parts[0][0].toUpperCase()
    }
  }
  if (user.email && user.email.length > 0) {
    return user.email[0].toUpperCase()
  }
  return '?'
}

export function TopHeader({ user, onMenuToggle }: TopHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme()

  function handleThemeToggle() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  function handleSignOut() {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="bg-background fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b px-4 lg:px-6">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu className="size-5" />
        </Button>

        <Link
          href="/dashboard"
          className="text-lg font-bold tracking-tight"
          style={{ color: '#0077b6' }}
        >
          DeployMate
        </Link>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1">
        {/* Search input - desktop only */}
        <div className="relative hidden w-64 lg:flex">
          <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search apps..."
            className="pl-9"
            aria-label="Search apps"
          />
        </div>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleThemeToggle}
          aria-label="Toggle theme"
        >
          <span className="relative">
            <Sun className="size-5 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute inset-0 size-5 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
          </span>
        </Button>

        {/* Notifications bell */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
        </Button>

        {/* User avatar with dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="User menu"
            >
              <Avatar>
                {user.image && (
                  <AvatarImage
                    src={user.image}
                    alt={user.name ?? 'User avatar'}
                  />
                )}
                <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="size-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="size-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
