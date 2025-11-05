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

interface ApproveRejectDialogProps {
  policy: Policy | null
  open: boolean
  onClose: () => void
  onSubmit: (action: 'approved' | 'rejected', note?: string) => void
  isLoading?: boolean
}

export function ApproveRejectDialog({
  policy,
  open,
  onClose,
  onSubmit,
  isLoading,
}: ApproveRejectDialogProps) {
  const [action, setAction] = useState<'approved' | 'rejected' | null>(null)
  const [note, setNote] = useState('')

  const handleSubmit = () => {
    if (!action) return
    onSubmit(action, note || undefined)
    setAction(null)
    setNote('')
  }

  const handleClose = () => {
    setAction(null)
    setNote('')
    onClose()
  }

  if (!policy) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Policy {policy.id}</DialogTitle>
          <DialogDescription>
            Review the policy details and approve or reject the application.
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
            <div>
              <div className="text-xs text-muted-foreground">Coverage</div>
              <div className="text-sm font-medium">${formatAmount(policy.coverageAmt)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Term</div>
              <div className="text-sm font-medium">{policy.termDays} days</div>
            </div>
          </div>

          {/* Action Selection */}
          {!action && (
            <div className="space-y-3">
              <Label>Select Action</Label>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 h-20 border-green-500 hover:bg-green-50"
                  onClick={() => setAction('approved')}
                >
                  <div className="text-center">
                    <div className="font-semibold text-green-700">Approve</div>
                    <div className="text-xs text-muted-foreground">
                      Policy will be activated
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-20 border-red-500 hover:bg-red-50"
                  onClick={() => setAction('rejected')}
                >
                  <div className="text-center">
                    <div className="font-semibold text-red-700">Reject</div>
                    <div className="text-xs text-muted-foreground">
                      Policy will be declined
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {/* Note Input (shown after action selection) */}
          {action && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-gray-50">
                <span className="font-semibold">
                  Action: {action === 'approved' ? 'Approve' : 'Reject'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAction(null)}
                  className="ml-2"
                >
                  Change
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Note (Optional)</Label>
                <Input
                  id="note"
                  placeholder={
                    action === 'rejected'
                      ? 'Reason for rejection...'
                      : 'Additional notes...'
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
            Cancel
          </Button>
          {action && (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              variant={action === 'approved' ? 'default' : 'destructive'}
            >
              {isLoading ? 'Submitting...' : `Confirm ${action === 'approved' ? 'Approval' : 'Rejection'}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
