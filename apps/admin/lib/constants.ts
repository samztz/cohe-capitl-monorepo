export const POLICY_STATUSES = {
  pending: { label: 'Pending', color: 'slate' },
  under_review: { label: 'Under Review', color: 'amber' },
  approved: { label: 'Approved', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
  expired: { label: 'Expired', color: 'gray' },
} as const

export const ITEMS_PER_PAGE = 20

export const MOCK_ADMIN_CREDENTIALS = {
  email: 'admin@cohe.capital',
  password: 'admin123',
}
