"use client"

import { useState } from "react"
import Link from "next/link"
import { Building2, ChevronDown, ChevronRight, Home, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

interface SidebarProps {
  pathname: string
  searchParams: Record<string, string>
  organizations: Array<{ name: string; slug: string }>
  onNavigate?: () => void
  className?: string
}

export function Sidebar({
  pathname,
  searchParams,
  organizations,
  onNavigate,
  className,
}: SidebarProps) {
  const [orgSectionExpanded, setOrgSectionExpanded] = useState(true)
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set())

  const activeOrgSlug = searchParams.org ?? null

  const isAllAppsActive =
    pathname === "/dashboard" && activeOrgSlug === null

  function toggleOrgExpanded(slug: string) {
    setExpandedOrgs((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) {
        next.delete(slug)
      } else {
        next.add(slug)
      }
      return next
    })
  }

  function handleLinkClick() {
    onNavigate?.()
  }

  return (
    <nav
      className={cn("flex w-64 flex-col gap-1 p-4", className)}
      aria-label="Sidebar navigation"
    >
      {/* All Apps link */}
      <Link
        href="/dashboard"
        onClick={handleLinkClick}
        className={cn(
          "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
          isAllAppsActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
        )}
      >
        <Home className="h-4 w-4 shrink-0" />
        <span>All Apps</span>
      </Link>

      <Separator className="my-2" />

      {/* Organizations section */}
      <div>
        <button
          type="button"
          onClick={() => setOrgSectionExpanded((prev) => !prev)}
          className="flex h-10 w-full items-center justify-between rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent/50 hover:text-accent-foreground"
        >
          <span>Organizations</span>
          {orgSectionExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
        </button>

        {orgSectionExpanded && (
          <ul className="mt-1 flex flex-col gap-0.5" role="list">
            {organizations.map((org) => {
              const isOrgActive = activeOrgSlug === org.slug
              const isOrgExpanded = expandedOrgs.has(org.slug)

              return (
                <li key={org.slug}>
                  <div className="flex items-center">
                    {/* Chevron toggle for expanding submenu */}
                    <button
                      type="button"
                      onClick={() => toggleOrgExpanded(org.slug)}
                      className="flex h-10 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-accent-foreground"
                      aria-label={`${isOrgExpanded ? "Collapse" : "Expand"} ${org.name}`}
                    >
                      {isOrgExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </button>

                    {/* Org name link */}
                    <Link
                      href={`/dashboard?org=${org.slug}`}
                      onClick={handleLinkClick}
                      className={cn(
                        "flex h-10 flex-1 items-center gap-3 rounded-md px-2 text-sm font-medium transition-colors",
                        isOrgActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                      )}
                    >
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span className="truncate">{org.name}</span>
                    </Link>
                  </div>

                  {/* Submenu: Groups */}
                  {isOrgExpanded && (
                    <ul className="ml-8 flex flex-col gap-0.5" role="list">
                      <li>
                        <Link
                          href={`/groups?org=${org.slug}`}
                          onClick={handleLinkClick}
                          className={cn(
                            "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                            pathname === "/groups" && activeOrgSlug === org.slug
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                          )}
                        >
                          <Layers className="h-4 w-4 shrink-0" />
                          <span>Groups</span>
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
              )
            })}

            {organizations.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground/60">
                No organizations yet
              </li>
            )}
          </ul>
        )}
      </div>
    </nav>
  )
}
