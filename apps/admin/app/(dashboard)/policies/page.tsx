'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { usePolicies } from '@/features/policies/hooks/usePolicies'
import { PolicyTable } from '@/features/policies/components/PolicyTable'
import { PolicyFilters } from '@/features/policies/components/PolicyFilters'
import { useLocaleStore } from '@/src/store/localeStore'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function PoliciesPage() {
  const { t } = useLocaleStore()
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data, isLoading } = usePolicies({
    status: status === 'all' ? undefined : status,
    q: search || undefined,
    page,
    pageSize,
  })

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.policiesPage.title}</h1>
          <p className="text-muted-foreground">
            {data ? `${data.total} ${t.dashboard.totalPolicies}` : t.common.loading}
          </p>
        </div>
      </div>

      <PolicyFilters
        status={status}
        search={search}
        onStatusChange={(s) => {
          setStatus(s)
          setPage(1)
        }}
        onSearchChange={(s) => {
          setSearch(s)
          setPage(1)
        }}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{t.common.loading}</div>
        </div>
      ) : (
        <>
          <PolicyTable policies={data?.items || []} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center py-4">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex items-center px-4 text-sm">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
