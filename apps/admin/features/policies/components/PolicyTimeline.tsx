import { Policy } from '../schemas'
import dayjs from 'dayjs'
import { CheckCircle, XCircle, Clock, FileText } from 'lucide-react'

interface PolicyTimelineProps {
  policy: Policy
}

export function PolicyTimeline({ policy }: PolicyTimelineProps) {
  const events = []

  // Created
  events.push({
    title: 'Policy Created',
    description: 'Policy application submitted',
    timestamp: policy.createdAt,
    icon: FileText,
    color: 'text-blue-600',
  })

  // Payment (if exists)
  if (policy.payments && policy.payments.length > 0) {
    const payment = policy.payments[0]
    events.push({
      title: 'Payment Received',
      description: `${payment.amount} ${payment.token} paid`,
      timestamp: payment.paidAt,
      icon: CheckCircle,
      color: 'text-green-600',
    })
  }

  // Status changes
  if (policy.status === 'PENDING_UNDERWRITING') {
    events.push({
      title: 'Under Review',
      description: 'Policy is being reviewed by admin',
      timestamp: policy.createdAt,
      icon: Clock,
      color: 'text-amber-600',
    })
  }

  if (policy.status === 'ACTIVE' && policy.startAt) {
    events.push({
      title: 'Active',
      description: 'Policy activated',
      timestamp: policy.startAt,
      icon: CheckCircle,
      color: 'text-green-600',
    })
  }

  if (policy.status === 'REJECTED') {
    events.push({
      title: 'Rejected',
      description: policy.reviewerNote || 'Policy application rejected',
      timestamp: policy.createdAt,
      icon: XCircle,
      color: 'text-red-600',
    })
  }

  if (policy.endAt) {
    const isExpired = dayjs(policy.endAt).isBefore(dayjs())
    events.push({
      title: isExpired ? 'Expired' : 'Expires',
      description: `Policy ${isExpired ? 'expired' : 'expires'} on this date`,
      timestamp: policy.endAt,
      icon: Clock,
      color: 'text-gray-600',
    })
  }

  // Sort by timestamp
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const Icon = event.icon
        return (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`rounded-full p-2 bg-gray-100 ${event.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              {index < events.length - 1 && (
                <div className="flex-1 w-px bg-gray-200 min-h-[40px]" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="font-medium">{event.title}</div>
              <div className="text-sm text-muted-foreground">{event.description}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {dayjs(event.timestamp).format('MMM D, YYYY HH:mm')}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
