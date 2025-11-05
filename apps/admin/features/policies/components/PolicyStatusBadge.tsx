import { Badge } from '@/components/ui/badge'
import { POLICY_STATUSES } from '@/lib/constants'
import { PolicyStatusType } from '../schemas'

interface PolicyStatusBadgeProps {
  status: PolicyStatusType
}

export function PolicyStatusBadge({ status }: PolicyStatusBadgeProps) {
  const config = POLICY_STATUSES[status]
  const variant = config.color as any

  return <Badge variant={variant}>{config.label}</Badge>
}
