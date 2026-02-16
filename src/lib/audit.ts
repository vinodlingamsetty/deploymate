import logger from '@/lib/logger'

interface AuditLogParams {
  userId: string
  orgId?: string | null
  action: 'create' | 'update' | 'delete'
  entityType: string
  entityId: string
  oldValue?: unknown
  newValue?: unknown
  ipAddress?: string | null
  userAgent?: string | null
}

/**
 * Create an audit log record. Fire-and-forget — failures are logged
 * but never break the primary operation.
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    const { db } = await import('@/lib/db')

    await db.auditLog.create({
      data: {
        userId: params.userId,
        orgId: params.orgId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValue: params.oldValue !== undefined
          ? (typeof params.oldValue === 'object' && params.oldValue !== null
              ? (params.oldValue as object)
              : { value: params.oldValue })
          : undefined,
        newValue: params.newValue !== undefined
          ? (typeof params.newValue === 'object' && params.newValue !== null
              ? (params.newValue as object)
              : { value: params.newValue })
          : undefined,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    })
  } catch (err) {
    logger.error({ err, audit: params }, 'Failed to create audit log')
  }
}

/**
 * Extract IP address and User-Agent from a Request for audit logging.
 */
export function extractRequestMeta(request: Request): {
  ipAddress: string | null
  userAgent: string | null
} {
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    null
  const userAgent = request.headers.get('user-agent') ?? null
  return { ipAddress, userAgent }
}
