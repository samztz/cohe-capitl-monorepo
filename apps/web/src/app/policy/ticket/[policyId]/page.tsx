'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function TicketPage() {
  const params = useParams()
  const policyId = params.policyId as string

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-4">
          <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-2">Insurance Policy Active</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Your policy is now active and coverage has begun
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Policy Information</h2>

        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">Policy ID</span>
            <span className="font-mono">{policyId.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">Product</span>
            <span className="font-medium">YULIY SHIELD INSURANCE</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">Coverage</span>
            <span className="font-medium">$10,000 USDT</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">Term</span>
            <span className="font-medium">90 days</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600 dark:text-gray-400">Status</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium">
              Active
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Link
          href={`/policy/status/${policyId}`}
          className="block w-full text-center py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          View Policy Status
        </Link>
        <Link
          href="/policies"
          className="block w-full text-center py-3 px-4 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          View All Policies
        </Link>
      </div>
    </div>
  )
}
