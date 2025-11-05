import { z } from 'zod'

export const PolicyStatus = z.enum([
  'pending',
  'under_review',
  'approved',
  'rejected',
  'expired',
])

export type PolicyStatusType = z.infer<typeof PolicyStatus>

export const Payment = z.object({
  id: z.string(),
  txHash: z.string().nullable(),
  chainId: z.number().nullable(),
  amount: z.number(),
  token: z.string().default('USDC'),
  paidAt: z.string(),
})

export type Payment = z.infer<typeof Payment>

export const Policy = z.object({
  id: z.string(),
  skuId: z.string(),
  skuName: z.string(),
  walletAddress: z.string(),
  premiumAmt: z.number(),
  coverageAmt: z.number(),
  termDays: z.number().default(90),
  startAt: z.string().nullable(),
  endAt: z.string().nullable(),
  createdAt: z.string(),
  status: PolicyStatus,
  email: z.string().email().optional(),
  phone: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  contractUrl: z.string().optional(),
  payments: z.array(Payment).default([]),
  reviewerNote: z.string().optional(),
})

export type Policy = z.infer<typeof Policy>

export const PoliciesResponse = z.object({
  items: z.array(Policy),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export type PoliciesResponse = z.infer<typeof PoliciesResponse>

export const StatsResponse = z.object({
  total: z.number(),
  underReview: z.number(),
  approvedToday: z.number(),
  rejectedToday: z.number(),
})

export type StatsResponse = z.infer<typeof StatsResponse>

export const ReviewRequest = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewerNote: z.string().optional(),
})

export type ReviewRequest = z.infer<typeof ReviewRequest>
