/**
 * In-memory sliding-window rate limiter.
 * Keyed by "endpoint:ip". Safe for single-process deployments.
 * For multi-process / multi-instance deployments, replace with a Redis-backed solution.
 */

interface Window {
  count: number
  windowStart: number
}

const store = new Map<string, Window>()

export interface RateLimitOptions {
  /** Duration of the sliding window in milliseconds. Default: 15 minutes */
  windowMs?: number
  /** Maximum number of requests allowed within the window */
  max: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check and increment the rate-limit counter for the given key.
 * Returns whether the request is allowed, remaining requests, and when the window resets.
 */
export function checkRateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const windowMs = opts.windowMs ?? 15 * 60 * 1000
  const now = Date.now()

  const entry = store.get(key)

  // Start a fresh window when none exists or the previous window has expired
  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: opts.max - 1, resetAt: now + windowMs }
  }

  if (entry.count >= opts.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.windowStart + windowMs,
    }
  }

  entry.count += 1
  return {
    allowed: true,
    remaining: opts.max - entry.count,
    resetAt: entry.windowStart + windowMs,
  }
}

/**
 * Build a rate-limit key from the request's IP address and the endpoint name.
 * IP resolution order: x-forwarded-for → x-real-ip → 'unknown'
 */
export function getRateLimitKey(request: Request, endpoint: string): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = (forwarded ? forwarded.split(',')[0].trim() : realIp) ?? 'unknown'
  return `${endpoint}:${ip}`
}
