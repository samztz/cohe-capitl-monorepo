'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'

export default function ContractSignPage() {
  const router = useRouter()
  const params = useParams()
  const policyId = params.policyId as string

  const [agreed, setAgreed] = useState(false)

  const handleSign = () => {
    if (agreed) {
      // Mock: 签署合约后跳转到支付页面
      router.push(`/policy/pay/${policyId}`)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Sign Contract</h1>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Insurance Agreement</h2>

        <div className="prose dark:prose-invert max-w-none mb-6 max-h-96 overflow-y-auto">
          <h3>Terms and Conditions</h3>
          <p>
            This Insurance Agreement ("Agreement") is entered into between the Policyholder
            and Cohe Capital Insurance Platform ("Provider").
          </p>

          <h4>1. Coverage Details</h4>
          <p>
            The Provider agrees to provide insurance coverage as specified in the policy
            details, including coverage amount, premium, and term duration.
          </p>

          <h4>2. Premium Payment</h4>
          <p>
            The Policyholder agrees to pay the specified premium amount in USDT to activate
            the insurance coverage.
          </p>

          <h4>3. Claims Process</h4>
          <p>
            In the event of a covered loss, the Policyholder must submit a claim with
            supporting documentation for review and processing.
          </p>

          <h4>4. Cancellation Policy</h4>
          <p>
            This policy may be cancelled by either party according to the terms specified
            in the policy documentation.
          </p>
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <input
            type="checkbox"
            id="agree"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="agree" className="text-sm">
            I have read and agree to the terms and conditions of this insurance agreement
          </label>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => router.back()}
          className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSign}
          disabled={!agreed}
          className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Sign Contract
        </button>
      </div>
    </div>
  )
}
