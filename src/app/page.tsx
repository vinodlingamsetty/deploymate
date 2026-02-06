export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-8">
      <h1 className="text-4xl font-bold">DeployMate</h1>
      <p className="text-muted-foreground">
        Built with Next.js, TypeScript, and Tailwind CSS
      </p>
      <code className="font-mono text-sm bg-muted px-4 py-2 rounded">
        pnpm dev
      </code>
    </main>
  )
}
