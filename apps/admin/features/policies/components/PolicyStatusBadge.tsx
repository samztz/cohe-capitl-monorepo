'use client'

import { Badge } from '@/components/ui/badge'
import { POLICY_STATUSES } from '@/lib/constants'
import { PolicyStatusType } from '../schemas'
import { useLocaleStore } from '@/src/store/localeStore'

interface PolicyStatusBadgeProps {
  status: PolicyStatusType
}

export function PolicyStatusBadge({ status }: PolicyStatusBadgeProps) {
  const { t } = useLocaleStore()
  const config = POLICY_STATUSES[status]
  const variant = config.color as any

  return <Badge variant={variant}>{t.status[status]}</Badge>
}
