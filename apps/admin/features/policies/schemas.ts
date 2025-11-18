import { z } from 'zod'

export const PolicyStatus = z.enum([
  'DRAFT',
  'PENDING_UNDERWRITING',
  'APPROVED_AWAITING_PAYMENT',
  'ACTIVE',
  'REJECTED',
  'EXPIRED_UNPAID',
  'EXPIRED',
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
  skuName: z.string().optional(),
  walletAddress: z.string(),
  premiumAmt: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
  coverageAmt: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) : val).optional(),
  termDays: z.number().default(90).optional(),
  startAt: z.string().nullable().optional(),
  endAt: z.string().nullable().optional(),
  paymentDeadline: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  status: PolicyStatus,
  email: z.string().email().optional(),
  phone: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  contractUrl: z.string().optional(),
  contractHash: z.string().optional(),
  payments: z.array(Payment).default([]),
  reviewerNote: z.string().optional(),

  // Handwritten signature fields
  signatureImageUrl: z.string().nullable().optional(),
  signatureHash: z.string().nullable().optional(),
  signatureSignedAt: z.string().nullable().optional(),
  signatureWalletAddress: z.string().nullable().optional(),
  signatureIp: z.string().nullable().optional(),
  signatureUserAgent: z.string().nullable().optional(),
})

export type Policy = z.infer<typeof Policy>

export const PoliciesResponse = z.object({
  items: z.array(Policy),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
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
  action: z.enum(['approve', 'reject']),
  paymentDeadline: z.string().optional(),
  reviewerNote: z.string().optional(),
})

export type ReviewRequest = z.infer<typeof ReviewRequest>
