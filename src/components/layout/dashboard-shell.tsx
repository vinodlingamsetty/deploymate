'use client'

import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

import { TopHeader } from '@/components/layout/top-header'
import { Sidebar } from '@/components/layout/sidebar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface DashboardShellProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  organizations: Array<{ name: string; slug: string }>
  children: React.ReactNode
}

export function DashboardShell({ user, organizations, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <div className="flex h-screen flex-col">
      {/* Skip-to-content link for keyboard/screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground"
      >
        Skip to content
      </a>

      {/* Top header — fixed, full width */}
      <TopHeader user={user} onMenuToggle={() => setSidebarOpen(true)} />

      {/* Body area below the fixed header */}
      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Desktop sidebar — always visible at lg+ */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r">
          <Sidebar
            pathname={pathname}
            searchParams={Object.fromEntries(searchParams.entries())}
            organizations={organizations}
          />
        </aside>

        {/* Mobile sidebar — Sheet drawer from left */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="border-b px-4 py-4">
              <SheetTitle
                className="text-lg font-bold tracking-tight"
                style={{ color: '#0077b6' }}
              >
                DeployMate
              </SheetTitle>
            </SheetHeader>
            <Sidebar
              pathname={pathname}
              searchParams={Object.fromEntries(searchParams.entries())}
              organizations={organizations}
              onNavigate={() => setSidebarOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {/* Main content area */}
        <main
          id="main-content"
          role="main"
          className="flex-1 overflow-auto p-4 md:p-6"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
