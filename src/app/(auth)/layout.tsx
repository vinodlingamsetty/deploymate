import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a8a] via-[#4c1d95] to-[#581c87] flex items-center justify-center p-4">
      {children}
    </div>
  )
}
