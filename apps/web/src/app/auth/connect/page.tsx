'use client'

import Link from 'next/link'

export default function ConnectPage() {
  const handleConnect = () => {
    // Mock: 直接跳转到邮箱验证
    window.location.href = '/auth/email-verify'
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Connect Wallet</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your wallet to continue
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleConnect}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Connect Wallet
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            By connecting, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  )
}
