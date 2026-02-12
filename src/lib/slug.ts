/**
 * Generate a URL-safe slug from a human-readable name.
 *
 * Transformations applied in order:
 *   1. Lowercase and trim surrounding whitespace
 *   2. Replace spaces and underscores with hyphens
 *   3. Strip all characters that are not lowercase letters, digits, or hyphens
 *   4. Collapse consecutive hyphens into a single one
 *   5. Remove any leading or trailing hyphens
 */
export function generateSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')    // spaces/underscores → hyphens
    .replace(/[^a-z0-9-]/g, '') // strip special chars
    .replace(/-+/g, '-')        // collapse multiple hyphens
    .replace(/^-|-$/g, '')      // trim leading/trailing hyphens

  return slug || 'org'
}
