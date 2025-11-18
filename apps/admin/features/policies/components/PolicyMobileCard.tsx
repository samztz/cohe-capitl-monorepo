'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Policy } from '../schemas'
import { PolicyStatusBadge } from './PolicyStatusBadge'
import { formatAddress, formatAmount } from '@/lib/utils'
import { useLocaleStore } from '@/src/store/localeStore'
import { Eye } from 'lucide-react'
import dayjs from 'dayjs'

interface PolicyMobileCardProps {
  policy: Policy
  showReviewButton?: boolean
  onReview?: (policy: Policy) => void
}

export function PolicyMobileCard({ policy, showReviewButton, onReview }: PolicyMobileCardProps) {
  const { t } = useLocaleStore()
  const router = useRouter()

  const handleCardClick = () => {
    router.push(`/policies/${policy.id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleCardClick()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className="rounded-lg border bg-white shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
    >
      {/* First Row: Product Name + Status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-gray-900 break-words flex-1">
          {policy.skuName || policy.skuId}
        </h3>
        <PolicyStatusBadge status={policy.status} />
      </div>

      {/* Second Row: Wallet Address + Created Time */}
      <div className="flex items-center justify-between gap-2 mb-3 text-xs text-gray-600">
        <span className="font-mono">{formatAddress(policy.walletAddress)}</span>
        <span>{dayjs(policy.createdAt).format('MMM D, YYYY HH:mm')}</span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div>
          <div className="text-gray-500 mb-0.5">{t.table.premium}</div>
          <div className="font-semibold text-gray-900">${formatAmount(policy.premiumAmt)}</div>
        </div>
        {policy.coverageAmt !== undefined && (
          <div>
            <div className="text-gray-500 mb-0.5">{t.table.skuCoverage}</div>
            <div className="font-semibold text-gray-900">${formatAmount(policy.coverageAmt)}</div>
          </div>
        )}
        {policy.termDays !== undefined && (
          <div>
            <div className="text-gray-500 mb-0.5">{t.table.term}</div>
            <div className="font-semibold text-gray-900">{policy.termDays} {t.table.days}</div>
          </div>
        )}
        {policy.email && (
          <div className="col-span-2">
            <div className="text-gray-500 mb-0.5">{t.table.user}</div>
            <div className="text-gray-900 break-words">{policy.email}</div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/policies/${policy.id}`)
          }}
          className="flex-1 min-h-[44px]"
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
            className="flex-1 min-h-[44px]"
          >
            {t.table.review}
          </Button>
        )}
      </div>
    </div>
  )
}
