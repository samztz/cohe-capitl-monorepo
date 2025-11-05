'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStats } from '@/features/policies/hooks/useStats'
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function DashboardPage() {
  const { data: stats, isLoading } = useStats()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Policies',
      value: stats?.total || 0,
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      title: 'Under Review',
      value: stats?.underReview || 0,
      icon: Clock,
      color: 'text-amber-600',
    },
    {
      title: 'Approved Today',
      value: stats?.approvedToday || 0,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Rejected Today',
      value: stats?.rejectedToday || 0,
      icon: XCircle,
      color: 'text-red-600',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* TODO: Add chart here */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Welcome to Cohe Capital Admin Dashboard. Use the navigation above to manage policies.
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• View and search all policies in the "All Policies" tab</li>
            <li>• Review pending policies in the "Review Queue" tab</li>
            <li>• Click on any policy to view details and approve/reject</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
