'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useLocaleStore } from '@/src/store/localeStore'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Button } from './ui/button'
import type { LucideIcon } from 'lucide-react'

interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  navigation: Array<{
    name: string
    href: string
    icon: LucideIcon
  }>
  userEmail: string | undefined
  onLogout: () => void
}

export function MobileNav({
  open,
  onOpenChange,
  navigation,
  userEmail,
  onLogout,
}: MobileNavProps) {
  const pathname = usePathname()
  const { t } = useLocaleStore()

  // Auto-close drawer when pathname changes
  React.useEffect(() => {
    onOpenChange(false)
  }, [pathname, onOpenChange])

  // Format email for display (truncate middle if too long)
  const formatEmail = (email: string | undefined) => {
    if (!email) return ''
    if (email.length <= 30) return email
    const [local, domain] = email.split('@')
    if (local.length > 15) {
      return `${local.substring(0, 12)}...@${domain}`
    }
    return email
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />

        {/* Drawer Content */}
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            'fixed left-0 top-0 z-50 h-full w-[80vw] min-w-[280px] max-w-[360px]',
            'bg-white shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
            'duration-300'
          )}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b px-4 py-4">
            <div className="flex-1">
              <h2 className="text-lg font-bold">Cohe Capital</h2>
              {userEmail && (
                <p className="text-xs text-gray-600 mt-1" title={userEmail}>
                  {formatEmail(userEmail)}
                </p>
              )}
            </div>
            <DialogPrimitive.Close
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto px-2 py-4">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors',
                        'min-h-[44px]', // Touch-friendly height
                        isActive
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Drawer Footer */}
          <div className="border-t px-4 py-4 space-y-3">
            <LanguageSwitcher />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onLogout()
                onOpenChange(false)
              }}
            >
              {t.navigation.logout}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
