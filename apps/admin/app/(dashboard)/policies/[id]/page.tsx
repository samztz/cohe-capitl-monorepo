'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usePolicyDetail, useReviewPolicy } from '@/features/policies/hooks/usePolicyDetail'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PolicyStatusBadge } from '@/features/policies/components/PolicyStatusBadge'
import { PolicyTimeline } from '@/features/policies/components/PolicyTimeline'
import { ApproveRejectDialog } from '@/features/policies/components/ApproveRejectDialog'
import { formatAddress, formatAmount } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Download, ExternalLink } from 'lucide-react'
import dayjs from 'dayjs'

export default function PolicyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)

  const { data: policy, isLoading } = usePolicyDetail(id)
  const reviewMutation = useReviewPolicy()
  const { toast } = useToast()

  const handleSubmitReview = async (data: { action: 'approve' | 'reject'; paymentDeadline?: string; reviewerNote?: string }) => {
    if (!policy) return

    try {
      await reviewMutation.mutateAsync({
        id: policy.id,
        data,
      })

      toast({
        title: `Policy ${data.action}d`,
        description: `Policy ${policy.id} has been ${data.action}d.`,
      })

      setReviewDialogOpen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update policy. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!policy) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/policies')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Policies
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Policy not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/policies')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{policy.id}</h1>
              <p className="text-sm text-muted-foreground">
                Created {dayjs(policy.createdAt).format('MMM D, YYYY')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PolicyStatusBadge status={policy.status} />
          {policy.status === 'PENDING_UNDERWRITING' && (
            <Button onClick={() => setReviewDialogOpen(true)}>Review Policy</Button>
          )}
        </div>
      </div>

      {/* Basic Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Policy Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Wallet Address</div>
              <div className="font-mono text-sm">{formatAddress(policy.walletAddress)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Email</div>
              <div className="text-sm">{policy.email || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Phone</div>
              <div className="text-sm">{policy.phone || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">SKU</div>
              <div className="text-sm font-medium">{policy.skuName}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Premium</div>
              <div className="text-sm font-medium">${formatAmount(policy.premiumAmt)}</div>
            </div>
            {policy.coverageAmt !== undefined && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Coverage Amount</div>
                <div className="text-sm font-medium">${formatAmount(policy.coverageAmt)}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Term</div>
              <div className="text-sm">{policy.termDays} days</div>
            </div>
            {policy.startAt && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Start Date</div>
                <div className="text-sm">{dayjs(policy.startAt).format('MMM D, YYYY')}</div>
              </div>
            )}
            {policy.endAt && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">End Date</div>
                <div className="text-sm">{dayjs(policy.endAt).format('MMM D, YYYY')}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract & Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {policy.contractUrl ? (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Insurance Contract</div>
                    <div className="text-sm text-muted-foreground">PDF Document</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No contract available yet
                </div>
              )}

              {policy.reviewerNote && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium mb-1">Reviewer Note</div>
                  <div className="text-sm text-muted-foreground">{policy.reviewerNote}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                {policy.payments.length} payment(s) recorded
              </CardDescription>
            </CardHeader>
            <CardContent>
              {policy.payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>Transaction</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policy.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-sm">{payment.id}</TableCell>
                        <TableCell>{formatAmount(payment.amount)}</TableCell>
                        <TableCell>{payment.token}</TableCell>
                        <TableCell>
                          {payment.txHash ? (
                            <a
                              href={`https://etherscan.io/tx/${payment.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-mono text-xs"
                            >
                              {formatAddress(payment.txHash)}
                            </a>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          {dayjs(payment.paidAt).format('MMM D, YYYY HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No payments recorded
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Policy Timeline</CardTitle>
              <CardDescription>Chronological history of policy events</CardDescription>
            </CardHeader>
            <CardContent>
              <PolicyTimeline policy={policy} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <ApproveRejectDialog
        policy={policy}
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        onSubmit={handleSubmitReview}
        isLoading={reviewMutation.isPending}
      />
    </div>
  )
}
