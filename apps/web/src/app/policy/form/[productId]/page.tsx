'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'

export default function PolicyFormPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.productId as string

  const [formData, setFormData] = useState({
    email: '',
    walletAddress: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock: 创建保单后跳转到合约签署
    router.push(`/policy/contract-sign/mock-policy-id`)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Policy Details</h1>

      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Product: YULIY SHIELD INSURANCE</h2>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">Coverage:</span> $10,000 USDT</p>
          <p><span className="font-medium">Premium:</span> $100 USDT</p>
          <p><span className="font-medium">Term:</span> 90 days</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
          />
        </div>

        <div>
          <label htmlFor="wallet" className="block text-sm font-medium mb-2">
            Wallet Address
          </label>
          <input
            id="wallet"
            type="text"
            value={formData.walletAddress}
            onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
            placeholder="0x..."
            required
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
          />
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
            Continue
          </button>
        </div>
      </form>
    </div>
  )
}
