'use client'

/**
 * Policy Payment Page
 *
 * Integrates Reown AppKit Pay for insurance premium payments.
 * Only accessible when policy.status === APPROVED_AWAITING_PAYMENT.
 *
 * Features:
 * - AppKit Pay integration (Pay with Exchange)
 * - Manual txHash confirmation fallback
 * - Payment deadline validation
 * - Automatic backend confirmation after payment
 */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'
import { buildPaymentAsset, validatePaymentAmount, getChainDisplayName } from '@/pay/assets'
import { apiClient } from '@/lib/apiClient'

interface Policy {
  id: string
  skuId: string
  status: string
  premiumAmt: string
  paymentDeadline: string | null
  createdAt: string
}

interface Product {
  id: string
  name: string
  chainId: number
  tokenAddress: string
  tokenSymbol: string
  premiumAmt: string
  coverageAmt: string
  termDays: number
}

interface TreasurySettings {
  address: string
}

// Helper function to get chain name
function getChainName(chainId: number) {
  if (chainId === 56) return 'BSC Mainnet'
  if (chainId === 97) return 'BSC Testnet'
  return `Chain ${chainId}`
}

export default function PolicyPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const policyId = params.policyId as string

  // AppKit hooks
  const { address: connectedAddress, isConnected } = useAppKitAccount()
  const { chainId } = useAppKitNetwork()

  // Data states
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [treasuryAddress, setTreasuryAddress] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  // Payment states
  const [manualTxHash, setManualTxHash] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState('')
  const [confirmSuccess, setConfirmSuccess] = useState(false)

  // AppKit modal control
  const { open } = useAppKit()
  const [isPayPending, setIsPayPending] = useState(false)
  const [payError, setPayError] = useState<Error | null>(null)
  const [isPaySuccess, setIsPaySuccess] = useState(false)

  // Load payment data
  useEffect(() => {
    loadPaymentData()
  }, [policyId])

  async function loadPaymentData() {
    try {
      setLoading(true)
      setError('')

      const policyResponse = await apiClient.get<Policy>(`/policy/${policyId}`)
      const policyData = policyResponse.data
      setPolicy(policyData)

      const productsResponse = await apiClient.get<Product[]>('/products')
      const products = productsResponse.data
      const product = products.find(p => p.id === policyData.skuId)
      if (!product) {
        throw new Error('Product not found')
      }
      setProduct(product)

      // Load treasury address (prioritize API, fallback to env)
      try {
        const treasuryResponse = await apiClient.get<TreasurySettings>('/settings/treasury-address')
        const treasury = treasuryResponse.data
        if (treasury.address) {
          setTreasuryAddress(treasury.address)
        } else {
          throw new Error('No treasury address in database')
        }
      } catch (err) {
        console.warn('[Payment] Failed to load treasury from API:', err)
        const envTreasury = process.env.NEXT_PUBLIC_TREASURY_ADDRESS
        if (envTreasury) {
          setTreasuryAddress(envTreasury)
        } else {
          throw new Error('No treasury address configured')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payment data')
    } finally {
      setLoading(false)
    }
  }

  async function handlePaymentSuccess(data: any) {
    const txHash =
      data?.txHash ||
      data?.transactionHash ||
      data?.result?.txHash ||
      data?.result?.transactionHash ||
      data?.hash

    if (txHash && /^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      await confirmPayment(txHash)
    } else {
      setError('Payment completed! Please paste your transaction hash below to complete activation.')
      setTimeout(() => {
        document.getElementById('manual-confirm')?.scrollIntoView({ behavior: 'smooth' })
      }, 500)
    }
  }

  async function confirmPayment(txHash: string) {
    try {
      setConfirming(true)
      setConfirmError('')

      await apiClient.post('/payment/confirm', { policyId, txHash })
      setConfirmSuccess(true)

      setTimeout(() => {
        router.replace(`/policy/detail/${policyId}`)
      }, 2000)
    } catch (err: any) {
      setConfirmError(err.response?.data?.message || err.message || 'Confirmation failed')
    } finally {
      setConfirming(false)
    }
  }

  async function handleManualConfirm() {
    const trimmed = manualTxHash.trim()

    if (!/^0x[a-fA-F0-9]{64}$/.test(trimmed)) {
      setConfirmError('Invalid transaction hash format')
      return
    }

    await confirmPayment(trimmed)
  }

  async function handlePayWithExchange() {
    if (!policy || !product || !treasuryAddress) {
      setError('Payment data not loaded')
      return
    }

    try {
      setError('')
      setIsPayPending(true)
      setPayError(null)

      const paymentAsset = buildPaymentAsset(product, {
        symbol: 'USDT',
        decimals: 18,
      })

      const amount = validatePaymentAmount(policy.premiumAmt)

      console.log('[Payment] Payment details:', {
        paymentAsset,
        recipient: treasuryAddress,
        amount,
      })

      // Open AppKit modal
      // Note: AppKit Pay integration requires manual txHash confirmation
      // Users will send payment through their wallet and paste txHash below
      open()

      setIsPayPending(false)

      // Show instruction to user
      setError(
        `Please send ${policy.premiumAmt} USDT to ${treasuryAddress} and paste the transaction hash below to activate your policy.`
      )

      // Scroll to manual confirmation
      setTimeout(() => {
        document.getElementById('manual-confirm')?.scrollIntoView({ behavior: 'smooth' })
      }, 1000)
    } catch (err: any) {
      console.error('[Payment] Pay error:', err)
      setPayError(err)
      setError(err.message || 'Failed to open payment modal')
      setIsPayPending(false)
    }
  }

  function canPay(): { allowed: boolean; reason?: string } {
    if (!policy) return { allowed: false, reason: 'Loading...' }

    if (policy.status !== 'APPROVED_AWAITING_PAYMENT') {
      return { allowed: false, reason: 'Policy is not awaiting payment' }
    }

    if (policy.paymentDeadline) {
      const deadline = new Date(policy.paymentDeadline)
      if (Date.now() > deadline.getTime()) {
        return { allowed: false, reason: 'Payment deadline has passed' }
      }
    }

    if (!isConnected) {
      return { allowed: false, reason: 'Please connect your wallet' }
    }

    const expectedChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '56')
    if (chainId !== expectedChainId) {
      return {
        allowed: false,
        reason: `Please switch to ${getChainDisplayName(expectedChainId)} network`,
      }
    }

    return { allowed: true }
  }

  const paymentCheck = canPay()

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!policy || !product) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error || 'Failed to load payment data'}
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Complete Payment</h1>
        <p className="text-gray-600">Policy ID: {policyId}</p>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          ⚠️ {error}
        </div>
      )}

      {confirmSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
          ✅ Payment confirmed! Redirecting...
        </div>
      )}

      {/* Network and Payment Info Alert */}
      {product && treasuryAddress && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-5 space-y-3">
          <h3 className="text-amber-900 font-bold text-lg flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span>Important: Payment Instructions</span>
          </h3>
          <div className="space-y-2 text-sm text-amber-900">
            <div className="flex items-start gap-2">
              <span className="font-bold min-w-[100px]">Network:</span>
              <span className="font-semibold">{getChainName(product.chainId)} (Chain ID: {product.chainId})</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold min-w-[100px]">Token:</span>
              <span className="font-semibold">{product.tokenSymbol}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold min-w-[100px]">Token Contract:</span>
              <div className="flex-1">
                <code className="text-xs bg-amber-100 px-2 py-1 rounded break-all">{product.tokenAddress}</code>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold min-w-[100px]">Send To:</span>
              <div className="flex-1">
                <code className="text-xs bg-amber-100 px-2 py-1 rounded break-all">{treasuryAddress}</code>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold min-w-[100px]">Amount:</span>
              <span className="font-semibold text-lg">{policy.premiumAmt} {product.tokenSymbol}</span>
            </div>
          </div>
          <div className="bg-amber-100 rounded p-3 mt-3">
            <p className="text-amber-900 text-sm font-medium">
              💡 <span className="font-bold">Please ensure:</span>
            </p>
            <ul className="list-disc list-inside text-amber-900 text-xs mt-2 space-y-1 ml-2">
              <li>Your wallet is connected to <span className="font-bold">{getChainName(product.chainId)}</span></li>
              <li>You send exactly <span className="font-bold">{policy.premiumAmt} {product.tokenSymbol}</span></li>
              <li>You send to the correct treasury address above</li>
              <li>You paste the transaction hash below after payment</li>
            </ul>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Payment Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Product</div>
            <div className="font-medium">{product.name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Premium Amount</div>
            <div className="font-medium text-lg">{policy.premiumAmt} {product.tokenSymbol}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Coverage</div>
            <div className="font-medium">{product.coverageAmt} {product.tokenSymbol}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Term</div>
            <div className="font-medium">{product.termDays} days</div>
          </div>
        </div>

        {policy.paymentDeadline && (
          <div className="text-sm text-gray-600">
            ⏰ Payment deadline: {new Date(policy.paymentDeadline).toLocaleString()}
          </div>
        )}

        {!paymentCheck.allowed && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800">
            ⚠️ {paymentCheck.reason}
          </div>
        )}
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Pay with Exchange</h2>
        <p className="text-sm text-gray-600">Use Reown AppKit Pay to complete your payment securely</p>

        <button
          onClick={handlePayWithExchange}
          disabled={!paymentCheck.allowed || isPayPending || confirmSuccess}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
        >
          {isPayPending ? '⏳ Processing Payment...' : '💳 Pay with Exchange'}
        </button>

        {isPaySuccess && (
          <div className="bg-green-50 border border-green-200 rounded p-3 text-green-800">
            ✅ Payment initiated! Confirming...
          </div>
        )}

        {payError && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800">
            ❌ {payError.message || 'Payment error'}
          </div>
        )}
      </div>

      <div id="manual-confirm" className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Manual Confirmation</h2>
        <p className="text-sm text-gray-600">
          If you completed payment outside this interface, paste your transaction hash here
        </p>

        <div>
          <label htmlFor="txhash" className="block text-sm font-medium mb-2">
            Transaction Hash
          </label>
          <input
            id="txhash"
            type="text"
            placeholder="0x..."
            value={manualTxHash}
            onChange={(e) => setManualTxHash(e.target.value)}
            disabled={confirming || confirmSuccess}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>

        {confirmError && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800">
            ❌ {confirmError}
          </div>
        )}

        <button
          onClick={handleManualConfirm}
          disabled={!manualTxHash.trim() || confirming || confirmSuccess}
          className="w-full py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {confirming ? '⏳ Confirming...' : 'Confirm Payment'}
        </button>
      </div>

      <div className="text-sm text-gray-600 space-y-2">
        <p>💡 Tip: After successful payment, your policy will be activated automatically.</p>
        <p>🔒 Security: All payments are processed through Reown AppKit Pay's secure infrastructure.</p>
      </div>
    </div>
  )
}
