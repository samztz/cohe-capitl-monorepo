import { NextRequest, NextResponse } from 'next/server'
import { MOCK_POLICIES } from '@/mocks/seed'
import { Policy } from '@/features/policies/schemas'

let policies: Policy[] = [...MOCK_POLICIES]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')
  const q = searchParams.get('q')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  let filtered = [...policies]

  // Filter by status
  if (status && status !== 'all') {
    filtered = filtered.filter((p) => p.status === status)
  }

  // Search by ID, wallet, or email
  if (q) {
    const query = q.toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.id.toLowerCase().includes(query) ||
        p.walletAddress.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query)
    )
  }

  // Sort by createdAt desc
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Pagination
  const total = filtered.length
  const start = (page - 1) * limit
  const items = filtered.slice(start, start + limit)

  return NextResponse.json({
    items,
    total,
    page,
    limit,
  })
}
