import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Smartphone, Users, Shield, Server } from 'lucide-react'

const features = [
  {
    icon: Smartphone,
    title: 'iOS & Android OTA',
    description: 'Distribute .ipa and .apk files over-the-air to testers with a single link.',
  },
  {
    icon: Users,
    title: 'Distribution Groups',
    description: 'Organize testers into groups for targeted, controlled releases.',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description: 'Control permissions with fine-grained organization roles.',
  },
  {
    icon: Server,
    title: 'Self-Hosted',
    description: 'Full control over your data and infrastructure — no vendor lock-in.',
  },
]

export default async function LandingPage() {
  const session = await auth()

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      {/* Header */}
      <header className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight" style={{ color: '#0077b6' }}>
            DeployMate
          </span>
          {session ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ backgroundColor: '#0077b6' }}
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              Login
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-20 sm:py-32">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-2xl leading-tight">
          Self-Hosted Beta App Distribution
        </h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl">
          Distribute iOS and Android beta builds to your testers — securely, directly from your own
          infrastructure.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: '#0077b6' }}
          >
            Get Started
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            Documentation
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="w-full px-4 sm:px-6 pb-20 sm:pb-32">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-semibold text-center mb-10 tracking-tight">
            Everything you need to ship betas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-lg border border-border bg-card p-6 flex gap-4"
              >
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: '#0077b615' }}
                >
                  <Icon className="w-5 h-5" style={{ color: '#0077b6' }} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>Released under the Apache 2.0 License.</span>
          <Link
            href="#"
            className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded"
          >
            View on GitHub
          </Link>
        </div>
      </footer>
    </div>
  )
}
