'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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
  X,
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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Controlled search value — initialise from URL so it stays in sync
  const [searchValue, setSearchValue] = useState(
    () => searchParams.get('search') ?? ''
  )

  const isDashboard = pathname.startsWith('/dashboard')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const mobileInputRef = useRef<HTMLInputElement>(null)

  const openMobileSearch = useCallback(() => {
    setMobileSearchOpen(true)
    // Focus the input on the next frame after it's rendered
    requestAnimationFrame(() => mobileInputRef.current?.focus())
  }, [])

  function closeMobileSearch() {
    setMobileSearchOpen(false)
  }

  function handleThemeToggle() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  async function handleSignOut() {
    await signOut({ redirect: false })
    router.push('/login')
  }

  // Clear the debounce timer on unmount to prevent state updates after unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setSearchValue(value)

    if (!isDashboard) return

    // State updates immediately for responsive UX; URL updates after 300ms debounce
    // to avoid excessive navigation during typing
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set('search', value)
      } else {
        params.delete('search')
      }
      router.push(`/dashboard?${params.toString()}`)
    }, 300)
  }

  return (
    <header className="bg-background fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b px-4 lg:px-6">
      {/* Mobile search overlay — replaces header content when active */}
      {mobileSearchOpen && (
        <div className="flex w-full items-center gap-2 lg:hidden">
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" aria-hidden="true" />
            <Input
              ref={mobileInputRef}
              type="search"
              placeholder="Search apps..."
              className="pl-9"
              aria-label="Search apps"
              value={searchValue}
              onChange={handleSearchChange}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMobileSearch}
            aria-label="Close search"
          >
            <X className="size-5" />
          </Button>
        </div>
      )}

      {/* Normal header content — hidden on mobile when search is open */}
      <div className={`flex w-full items-center justify-between ${mobileSearchOpen ? 'hidden lg:flex' : 'flex'}`}>
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
            <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" aria-hidden="true" />
            <Input
              type="search"
              placeholder="Search apps..."
              className="pl-9"
              aria-label="Search apps"
              value={searchValue}
              onChange={handleSearchChange}
            />
          </div>

          {/* Search icon button - mobile only */}
          {isDashboard && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={openMobileSearch}
              aria-label="Search apps"
            >
              <Search className="size-5" />
            </Button>
          )}

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
      </div>
    </header>
  )
}
