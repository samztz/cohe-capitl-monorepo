'use client'

import Link from 'next/link'

export default function PolicyDetailPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Policy Detail</h1>

      <div className="grid gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">YULIY SHIELD INSURANCE</h2>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Coverage Amount</p>
              <p className="text-lg font-semibold">$10,000 USDT</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Premium</p>
              <p className="text-lg font-semibold">$100 USDT</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Term</p>
              <p className="text-lg font-semibold">90 days</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-sm font-medium">
                Pending
              </span>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none mb-6">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p>
              Comprehensive insurance coverage for Coinbase Custody claims. This policy provides
              protection against eligible losses and includes 24/7 support.
            </p>
          </div>

          <Link
            href="/policy/form/mock-product-id"
            className="block w-full text-center py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Purchase Policy
          </Link>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Coverage Details</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Full coverage for custody-related losses</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>24/7 claims support</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Fast claim processing (5-7 business days)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Transparent on-chain verification</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
