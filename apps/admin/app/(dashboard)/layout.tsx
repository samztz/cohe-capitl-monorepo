'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { isAuthed, logout, getUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/toaster'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLocaleStore } from '@/src/store/localeStore'
import { LayoutDashboard, FileText, ClipboardCheck, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLocaleStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isAuthed()) {
      router.push('/login')
    }
  }, [router])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const user = getUser()

  if (!isAuthed()) {
    return null
  }

  const navigation = [
    { name: t.navigation.dashboard, href: '/dashboard', icon: LayoutDashboard },
    { name: t.navigation.allPolicies, href: '/policies', icon: FileText },
    { name: t.navigation.reviewQueue, href: '/review', icon: ClipboardCheck },
  ]

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <nav className="bg-white border-b">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between items-center">
              <div className="flex items-center space-x-8">
                <div className="flex-shrink-0">
                  <h1 className="text-xl font-bold">Cohe Capital</h1>
                </div>
                <div className="hidden md:flex space-x-4">
                  {navigation.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                          isActive
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <LanguageSwitcher />
                <span className="text-sm text-gray-600">{user?.email}</span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t.navigation.logout}
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="py-6">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  )
}
