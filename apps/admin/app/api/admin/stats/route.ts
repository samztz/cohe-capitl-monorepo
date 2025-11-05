import { NextResponse } from 'next/server'
import { MOCK_POLICIES } from '@/mocks/seed'
import dayjs from 'dayjs'

export async function GET() {
  const policies = MOCK_POLICIES
  const today = dayjs().startOf('day')

  const stats = {
    total: policies.length,
    underReview: policies.filter((p) => p.status === 'under_review').length,
    approvedToday: policies.filter(
      (p) =>
        p.status === 'approved' &&
        p.startAt &&
        dayjs(p.startAt).isAfter(today)
    ).length,
    rejectedToday: policies.filter(
      (p) =>
        p.status === 'rejected' &&
        dayjs(p.createdAt).isAfter(today)
    ).length,
  }

  return NextResponse.json(stats)
}
