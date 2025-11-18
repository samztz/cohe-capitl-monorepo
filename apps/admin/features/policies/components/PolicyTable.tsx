'use client'

import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Policy } from '../schemas'
import { PolicyStatusBadge } from './PolicyStatusBadge'
import { PolicyMobileCard } from './PolicyMobileCard'
import { formatAddress, formatAmount } from '@/lib/utils'
import { useLocaleStore } from '@/src/store/localeStore'
import { Eye } from 'lucide-react'
import dayjs from 'dayjs'

interface PolicyTableProps {
  policies: Policy[]
  showReviewButton?: boolean
  onReview?: (policy: Policy) => void
}

export function PolicyTable({ policies, showReviewButton, onReview }: PolicyTableProps) {
  const { t } = useLocaleStore()
  const router = useRouter()

  if (policies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">{t.table.noPoliciesFound}</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table View (≥1000px) */}
      <div className="min-[1000px]:block max-[1000px]:hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.table.policyId}</TableHead>
              <TableHead>{t.table.user}</TableHead>
              <TableHead>{t.table.skuCoverage}</TableHead>
              <TableHead>{t.table.premium}</TableHead>
              <TableHead>{t.table.term}</TableHead>
              <TableHead>{t.table.status}</TableHead>
              <TableHead>{t.table.created}</TableHead>
              <TableHead>{t.table.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.map((policy) => (
              <TableRow key={policy.id} className="cursor-pointer hover:bg-gray-50">
                <TableCell className="font-medium">{policy.id}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm font-mono">
                      {formatAddress(policy.walletAddress)}
                    </div>
                    {policy.email && (
                      <div className="text-xs text-muted-foreground">{policy.email}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{policy.skuName || policy.skuId}</div>
                    {policy.coverageAmt !== undefined && (
                      <div className="text-xs text-muted-foreground">
                        ${formatAmount(policy.coverageAmt)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>${formatAmount(policy.premiumAmt)}</TableCell>
                <TableCell>{policy.termDays !== undefined ? `${policy.termDays} ${t.table.days}` : 'N/A'}</TableCell>
                <TableCell>
                  <PolicyStatusBadge status={policy.status} />
                </TableCell>
                <TableCell>
                  <div className="text-sm">{dayjs(policy.createdAt).format('MMM D, YYYY')}</div>
                  <div className="text-xs text-muted-foreground">
                    {dayjs(policy.createdAt).format('HH:mm')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/policies/${policy.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {t.common.view}
                    </Button>
                    {showReviewButton && policy.status === 'PENDING_UNDERWRITING' && onReview && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onReview(policy)
                        }}
                      >
                        {t.table.review}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View (<1000px) */}
      <div className="max-[1000px]:block min-[1000px]:hidden space-y-3">
        {policies.map((policy) => (
          <PolicyMobileCard
            key={policy.id}
            policy={policy}
            showReviewButton={showReviewButton}
            onReview={onReview}
          />
        ))}
      </div>
    </>
  )
}
