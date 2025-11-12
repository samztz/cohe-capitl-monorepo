'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function TopNav() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-bold text-xl">
            Cohe Capital
          </Link>

          <div className="flex gap-6">
            <Link
              href="/products"
              className={`hover:text-blue-600 transition-colors ${
                isActive('/products') ? 'text-blue-600' : ''
              }`}
            >
              Products
            </Link>
            <Link
              href="/policies"
              className={`hover:text-blue-600 transition-colors ${
                isActive('/policies') ? 'text-blue-600' : ''
              }`}
            >
              My Policies
            </Link>
          </div>

          <div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
