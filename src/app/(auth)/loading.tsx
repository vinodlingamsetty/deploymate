export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#1e3a8a] via-[#4c1d95] to-[#581c87]" role="status" aria-busy="true" aria-live="polite">
      <p className="text-white/90">Loading...</p>
    </div>
  )
}
