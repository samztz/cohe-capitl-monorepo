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
import { formatAddress, formatAmount } from '@/lib/utils'
import { Eye } from 'lucide-react'
import dayjs from 'dayjs'

interface PolicyTableProps {
  policies: Policy[]
  showReviewButton?: boolean
  onReview?: (policy: Policy) => void
}

export function PolicyTable({ policies, showReviewButton, onReview }: PolicyTableProps) {
  const router = useRouter()

  if (policies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No policies found</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Policy ID</TableHead>
            <TableHead>User</TableHead>
            <TableHead>SKU / Coverage</TableHead>
            <TableHead>Premium</TableHead>
            <TableHead>Term</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
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
                  <div className="text-sm font-medium">{policy.skuName}</div>
                  <div className="text-xs text-muted-foreground">
                    ${formatAmount(policy.coverageAmt)}
                  </div>
                </div>
              </TableCell>
              <TableCell>${formatAmount(policy.premiumAmt)}</TableCell>
              <TableCell>{policy.termDays} days</TableCell>
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
                    View
                  </Button>
                  {showReviewButton && policy.status === 'under_review' && onReview && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onReview(policy)
                      }}
                    >
                      Review
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
