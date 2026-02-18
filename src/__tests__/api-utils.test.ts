import { describe, it, expect } from 'vitest'
import { successResponse, errorResponse, paginatedResponse } from '@/lib/api-utils'

describe('successResponse', () => {
  it('wraps data in { data } envelope with 200 status by default', async () => {
    const res = successResponse({ id: '1', name: 'Test' })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toEqual({ data: { id: '1', name: 'Test' } })
  })

  it('accepts a custom status code', async () => {
    const res = successResponse({ created: true }, 201)
    expect(res.status).toBe(201)
  })
})

describe('errorResponse', () => {
  it('wraps error in { error: { code, message } } envelope', async () => {
    const res = errorResponse('NOT_FOUND', 'Resource not found', 404)
    const body = await res.json()
    expect(res.status).toBe(404)
    expect(body).toEqual({ error: { code: 'NOT_FOUND', message: 'Resource not found' } })
  })

  it('defaults to 400 status', async () => {
    const res = errorResponse('BAD_REQUEST', 'Invalid input')
    expect(res.status).toBe(400)
  })
})

describe('paginatedResponse', () => {
  it('includes data array and meta with totalPages', async () => {
    const items = [{ id: '1' }, { id: '2' }]
    const res = paginatedResponse(items, { page: 1, limit: 10, total: 25 })
    const body = await res.json()
    expect(body.data).toEqual(items)
    expect(body.meta).toEqual({ page: 1, limit: 10, total: 25, totalPages: 3 })
  })

  it('calculates totalPages correctly for exact division', async () => {
    const res = paginatedResponse([], { page: 1, limit: 10, total: 20 })
    const body = await res.json()
    expect(body.meta.totalPages).toBe(2)
  })

  it('handles empty results', async () => {
    const res = paginatedResponse([], { page: 1, limit: 20, total: 0 })
    const body = await res.json()
    expect(body.data).toEqual([])
    expect(body.meta.totalPages).toBe(0)
  })
})
