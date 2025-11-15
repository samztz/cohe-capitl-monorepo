'use client'

import { useState } from 'react'
import { usePolicies } from '@/features/policies/hooks/usePolicies'
import { useReviewPolicy } from '@/features/policies/hooks/usePolicyDetail'
import { PolicyTable } from '@/features/policies/components/PolicyTable'
import { ApproveRejectDialog } from '@/features/policies/components/ApproveRejectDialog'
import { Policy } from '@/features/policies/schemas'
import { useToast } from '@/components/ui/use-toast'
import { useLocaleStore } from '@/src/store/localeStore'

export default function ReviewPage() {
  const { t } = useLocaleStore()
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading } = usePolicies({ status: 'PENDING_UNDERWRITING' })
  const reviewMutation = useReviewPolicy()
  const { toast } = useToast()

  const handleReview = (policy: Policy) => {
    setSelectedPolicy(policy)
    setDialogOpen(true)
  }

  const handleSubmitReview = async (data: { action: 'approve' | 'reject'; paymentDeadline?: string; reviewerNote?: string }) => {
    if (!selectedPolicy) return

    try {
      await reviewMutation.mutateAsync({
        id: selectedPolicy.id,
        data,
      })

      toast({
        title: `Policy ${data.action}d`,
        description: `Policy ${selectedPolicy.id} has been ${data.action}d.`,
      })

      setDialogOpen(false)
      setSelectedPolicy(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update policy. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.reviewPage.title}</h1>
        <p className="text-muted-foreground">
          {data ? `${data.total} ${t.dashboard.pendingReview}` : t.common.loading}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{t.common.loading}</div>
        </div>
      ) : (
        <PolicyTable
          policies={data?.items || []}
          showReviewButton
          onReview={handleReview}
        />
      )}

      <ApproveRejectDialog
        policy={selectedPolicy}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setSelectedPolicy(null)
        }}
        onSubmit={handleSubmitReview}
        isLoading={reviewMutation.isPending}
      />
    </div>
  )
}
