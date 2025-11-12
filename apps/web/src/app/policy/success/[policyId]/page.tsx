'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function PurchaseSuccessPage() {
  const params = useParams()
  const policyId = params.policyId as string

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full mb-6">
            <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4">Purchase Successful!</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Your insurance policy has been created
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 mb-6">
          <h2 className="text-lg font-semibold mb-6 text-center">What happens next?</h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                1
              </div>
              <div>
                <h3 className="font-medium mb-1">Payment Verification</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We're verifying your payment on the blockchain. This usually takes 5-10 minutes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                2
              </div>
              <div>
                <h3 className="font-medium mb-1">Policy Review</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Our team will review your policy application. This typically takes 24-48 hours.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                3
              </div>
              <div>
                <h3 className="font-medium mb-1">Policy Activation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Once approved, your policy will be activated and you'll receive a confirmation email.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href={`/policy/ticket/${policyId}`}
            className="block w-full text-center py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View Policy Ticket
          </Link>
          <Link
            href="/products"
            className="block w-full text-center py-3 px-4 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Browse More Products
          </Link>
        </div>
      </div>
    </div>
  )
}
