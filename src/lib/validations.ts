import { z } from 'zod'

// ============================================================
// Pagination
// ============================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export function parsePagination(searchParams: URLSearchParams) {
  return paginationSchema.parse({
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  })
}

// ============================================================
// Apps
// ============================================================

export const createAppSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  platform: z.enum(['IOS', 'ANDROID']),
  orgId: z.string().min(1, 'Organization ID is required'),
  bundleId: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
})

export const updateAppSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(1000).nullable().optional(),
    bundleId: z.string().max(255).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

// ============================================================
// Sort
// ============================================================

export const appSortSchema = z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt')
export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc')
