import { NextRequest, NextResponse } from 'next/server'
import { MOCK_POLICIES } from '@/mocks/seed'
import { Policy } from '@/features/policies/schemas'
import dayjs from 'dayjs'

let policies: Policy[] = [...MOCK_POLICIES]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const policy = policies.find((p) => p.id === params.id)

  if (!policy) {
    return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
  }

  return NextResponse.json(policy)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const { status, reviewerNote } = body

  const policyIndex = policies.findIndex((p) => p.id === params.id)

  if (policyIndex === -1) {
    return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
  }

  const policy = policies[policyIndex]

  // Update status and add timestamps
  if (status === 'approved') {
    policy.status = 'approved'
    policy.startAt = dayjs().toISOString()
    policy.endAt = dayjs().add(policy.termDays, 'day').toISOString()
  } else if (status === 'rejected') {
    policy.status = 'rejected'
  }

  if (reviewerNote) {
    policy.reviewerNote = reviewerNote
  }

  policies[policyIndex] = policy

  return NextResponse.json(policy)
}
