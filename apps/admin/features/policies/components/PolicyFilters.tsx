'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLocaleStore } from '@/src/store/localeStore'
import { Search } from 'lucide-react'

interface PolicyFiltersProps {
  status: string
  search: string
  onStatusChange: (status: string) => void
  onSearchChange: (search: string) => void
}

export function PolicyFilters({
  status,
  search,
  onStatusChange,
  onSearchChange,
}: PolicyFiltersProps) {
  const { t } = useLocaleStore()

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.filters.searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder={t.filters.filterByStatus} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.filters.all}</SelectItem>
          <SelectItem value="DRAFT">{t.status.DRAFT}</SelectItem>
          <SelectItem value="PENDING_UNDERWRITING">{t.status.PENDING_UNDERWRITING}</SelectItem>
          <SelectItem value="APPROVED_AWAITING_PAYMENT">{t.status.APPROVED_AWAITING_PAYMENT}</SelectItem>
          <SelectItem value="ACTIVE">{t.status.ACTIVE}</SelectItem>
          <SelectItem value="REJECTED">{t.status.REJECTED}</SelectItem>
          <SelectItem value="EXPIRED_UNPAID">{t.status.EXPIRED_UNPAID}</SelectItem>
          <SelectItem value="EXPIRED">{t.status.EXPIRED}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
