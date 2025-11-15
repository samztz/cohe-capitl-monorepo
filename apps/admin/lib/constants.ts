export const POLICY_STATUSES = {
  DRAFT: { label: 'Draft', color: 'slate' },
  PENDING_UNDERWRITING: { label: 'Pending Review', color: 'amber' },
  APPROVED_AWAITING_PAYMENT: { label: 'Awaiting Payment', color: 'blue' },
  ACTIVE: { label: 'Active', color: 'green' },
  REJECTED: { label: 'Rejected', color: 'red' },
  EXPIRED_UNPAID: { label: 'Expired (Unpaid)', color: 'gray' },
  EXPIRED: { label: 'Expired', color: 'gray' },
} as const

export const ITEMS_PER_PAGE = 20

export const MOCK_ADMIN_CREDENTIALS = {
  email: 'admin@cohe.capital',
  password: 'admin123',
}
