'use client'

import { useState } from 'react'
import { usePolicies } from '@/features/policies/hooks/usePolicies'
import { useReviewPolicy } from '@/features/policies/hooks/usePolicyDetail'
import { PolicyTable } from '@/features/policies/components/PolicyTable'
import { ApproveRejectDialog } from '@/features/policies/components/ApproveRejectDialog'
import { Policy } from '@/features/policies/schemas'
import { useToast } from '@/components/ui/use-toast'

export default function ReviewPage() {
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading } = usePolicies({ status: 'under_review' })
  const reviewMutation = useReviewPolicy()
  const { toast } = useToast()

  const handleReview = (policy: Policy) => {
    setSelectedPolicy(policy)
    setDialogOpen(true)
  }

  const handleSubmitReview = async (action: 'approved' | 'rejected', note?: string) => {
    if (!selectedPolicy) return

    try {
      await reviewMutation.mutateAsync({
        id: selectedPolicy.id,
        data: {
          status: action,
          reviewerNote: note,
        },
      })

      toast({
        title: `Policy ${action}`,
        description: `Policy ${selectedPolicy.id} has been ${action}.`,
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
        <h1 className="text-3xl font-bold">Review Queue</h1>
        <p className="text-muted-foreground">
          {data ? `${data.total} policies awaiting review` : 'Loading...'}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading review queue...</div>
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
