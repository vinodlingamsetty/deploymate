export function getInitials(
  firstName: string | null,
  lastName: string | null,
  email: string,
): string {
  const f = firstName?.trim()
  const l = lastName?.trim()

  if (f && l) return `${f[0]}${l[0]}`.toUpperCase()
  if (f) return f[0].toUpperCase()
  if (l) return l[0].toUpperCase()
  return (email[0] || 'U').toUpperCase()
}
