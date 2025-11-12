'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'

export default function PayPage() {
  const router = useRouter()
  const params = useParams()
  const policyId = params.policyId as string

  const [txHash, setTxHash] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (txHash) {
      // Mock: 提交支付后跳转到成功页面
      router.push(`/policy/success/${policyId}`)
    }
  }

  const handleCopyAddress = () => {
    navigator.clipboard.writeText('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1')
    alert('Address copied!')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Payment</h1>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Please send the exact premium amount to the treasury address below
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Payment Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <p className="text-2xl font-bold">100 USDT</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Network</label>
              <p className="text-lg">BSC (BNB Chain)</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Treasury Address</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-sm break-all">
                  0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
                </code>
                <button
                  onClick={handleCopyAddress}
                  className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="txHash" className="block text-sm font-medium mb-2">
              Transaction Hash
            </label>
            <input
              id="txHash"
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="0x..."
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
            />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enter the transaction hash after sending payment
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Submit Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
