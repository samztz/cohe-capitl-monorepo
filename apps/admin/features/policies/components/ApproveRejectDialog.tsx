'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Policy } from '../schemas'
import { formatAddress, formatAmount } from '@/lib/utils'
import { useLocaleStore } from '@/src/store/localeStore'

interface ApproveRejectDialogProps {
  policy: Policy | null
  open: boolean
  onClose: () => void
  onSubmit: (data: { action: 'approve' | 'reject'; paymentDeadline?: string; reviewerNote?: string }) => void
  isLoading?: boolean
}

export function ApproveRejectDialog({
  policy,
  open,
  onClose,
  onSubmit,
  isLoading,
}: ApproveRejectDialogProps) {
  const { t } = useLocaleStore()
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [note, setNote] = useState('')
  const [paymentDeadline, setPaymentDeadline] = useState('')

  // Set default deadline to now + 24 hours when approve is selected
  const handleSetAction = (newAction: 'approve' | 'reject') => {
    setAction(newAction)
    if (newAction === 'approve') {
      const tomorrow = new Date()
      tomorrow.setHours(tomorrow.getHours() + 24)
      // Format to datetime-local format: YYYY-MM-DDTHH:mm
      const formatted = tomorrow.toISOString().slice(0, 16)
      setPaymentDeadline(formatted)
    }
  }

  const handleSubmit = () => {
    if (!action) return
    const data: { action: 'approve' | 'reject'; paymentDeadline?: string; reviewerNote?: string } = {
      action,
      reviewerNote: note || undefined,
    }
    if (action === 'approve' && paymentDeadline) {
      // Convert datetime-local to ISO 8601
      data.paymentDeadline = new Date(paymentDeadline).toISOString()
    }
    onSubmit(data)
    setAction(null)
    setNote('')
    setPaymentDeadline('')
  }

  const handleClose = () => {
    setAction(null)
    setNote('')
    setPaymentDeadline('')
    onClose()
  }

  if (!policy) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.reviewDialog.title}</DialogTitle>
          <DialogDescription>
            {t.reviewDialog.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Policy Summary */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-xs text-muted-foreground">Wallet Address</div>
              <div className="font-mono text-sm">{formatAddress(policy.walletAddress)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              <div className="text-sm">{policy.email || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">SKU</div>
              <div className="text-sm font-medium">{policy.skuName}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Premium</div>
              <div className="text-sm font-medium">${formatAmount(policy.premiumAmt)}</div>
            </div>
            {policy.coverageAmt !== undefined && (
              <div>
                <div className="text-xs text-muted-foreground">Coverage</div>
                <div className="text-sm font-medium">${formatAmount(policy.coverageAmt)}</div>
              </div>
            )}
            {policy.termDays !== undefined && (
              <div>
                <div className="text-xs text-muted-foreground">Term</div>
                <div className="text-sm font-medium">{policy.termDays} days</div>
              </div>
            )}
          </div>

          {/* Action Selection */}
          {!action && (
            <div className="space-y-3">
              <Label>Select Action</Label>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 h-20 border-green-500 hover:bg-green-50"
                  onClick={() => handleSetAction('approve')}
                >
                  <div className="text-center">
                    <div className="font-semibold text-green-700">{t.reviewDialog.approve}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.reviewDialog.awaitingPayment}
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-20 border-red-500 hover:bg-red-50"
                  onClick={() => handleSetAction('reject')}
                >
                  <div className="text-center">
                    <div className="font-semibold text-red-700">{t.reviewDialog.reject}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.reviewDialog.policyWillBeDeclined}
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {/* Payment Deadline & Note Input (shown after action selection) */}
          {action && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-gray-50">
                <span className="font-semibold">
                  Action: {action === 'approve' ? t.reviewDialog.approve : t.reviewDialog.reject}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAction(null)}
                  className="ml-2"
                >
                  {t.common.change}
                </Button>
              </div>

              {action === 'approve' && (
                <div className="space-y-2">
                  <Label htmlFor="paymentDeadline">{t.reviewDialog.paymentDeadline} *</Label>
                  <Input
                    id="paymentDeadline"
                    type="datetime-local"
                    value={paymentDeadline}
                    onChange={(e) => setPaymentDeadline(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t.reviewDialog.paymentDeadlineHint}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="note">{t.common.note} ({t.common.optional})</Label>
                <Input
                  id="note"
                  placeholder={
                    action === 'reject'
                      ? t.reviewDialog.rejectNotePlaceholder
                      : t.reviewDialog.approveNotePlaceholder
                  }
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {t.common.cancel}
          </Button>
          {action && (
            <Button
              onClick={handleSubmit}
              disabled={isLoading || (action === 'approve' && !paymentDeadline)}
              variant={action === 'approve' ? 'default' : 'destructive'}
            >
              {isLoading ? t.reviewDialog.submitting : (action === 'approve' ? t.reviewDialog.confirmApproval : t.reviewDialog.confirmRejection)}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
