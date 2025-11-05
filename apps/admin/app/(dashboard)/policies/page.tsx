'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { usePolicies } from '@/features/policies/hooks/usePolicies'
import { PolicyTable } from '@/features/policies/components/PolicyTable'
import { PolicyFilters } from '@/features/policies/components/PolicyFilters'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function PoliciesPage() {
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading } = usePolicies({
    status: status === 'all' ? undefined : status,
    q: search || undefined,
    page,
    limit,
  })

  const totalPages = data ? Math.ceil(data.total / limit) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Policies</h1>
          <p className="text-muted-foreground">
            {data ? `${data.total} total policies` : 'Loading...'}
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
          <div className="text-muted-foreground">Loading policies...</div>
        </div>
      ) : (
        <>
          <PolicyTable policies={data?.items || []} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
