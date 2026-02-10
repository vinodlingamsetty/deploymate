import { NextResponse } from 'next/server'

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}

export function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export function paginatedResponse<T>(
  data: T[],
  meta: { page: number; limit: number; total: number },
) {
  return NextResponse.json({
    data,
    meta: { ...meta, totalPages: Math.ceil(meta.total / meta.limit) },
  })
}
