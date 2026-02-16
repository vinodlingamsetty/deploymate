export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-busy="true" aria-live="polite">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  )
}
