'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function PolicyStatusPage() {
  const params = useParams()
  const policyId = params.policyId as string

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Policy Status</h1>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold">YULIY SHIELD INSURANCE</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono mt-1">
                Policy ID: {policyId.slice(0, 16)}...
              </p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium">
              Active
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Coverage</p>
              <p className="text-lg font-semibold">$10,000 USDT</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Premium Paid</p>
              <p className="text-lg font-semibold">$100 USDT</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Days Remaining</p>
              <p className="text-lg font-semibold">85 days</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Timeline</h3>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>
              </div>
              <div className="pb-8">
                <p className="font-medium">Policy Activated</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">2024-01-15 10:30 AM</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>
              </div>
              <div className="pb-8">
                <p className="font-medium">Payment Confirmed</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">2024-01-15 10:25 AM</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 font-mono mt-1">
                  Tx: 0xabc...def
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>
              </div>
              <div className="pb-8">
                <p className="font-medium">Contract Signed</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">2024-01-15 10:20 AM</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium">Policy Created</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">2024-01-15 10:15 AM</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Link
            href="/policies"
            className="flex-1 text-center py-3 px-4 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Back to Policies
          </Link>
          <button
            className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            onClick={() => alert('Claim functionality coming soon')}
          >
            File a Claim
          </button>
        </div>
      </div>
    </div>
  )
}
