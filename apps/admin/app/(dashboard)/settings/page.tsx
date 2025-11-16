'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useLocaleStore } from '@/src/store/localeStore'
import { apiClient } from '@/lib/apiClient'

interface TreasuryResponse {
  address: string | null
}

interface UpdateResponse {
  success: boolean
  address: string
}

export default function SettingsPage() {
  const { t } = useLocaleStore()

  // Treasury address state
  const [currentAddress, setCurrentAddress] = useState<string>('')
  const [newAddress, setNewAddress] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // Load current treasury address
  useEffect(() => {
    loadTreasuryAddress()
  }, [])

  async function loadTreasuryAddress() {
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.get<TreasuryResponse>('/admin/settings/treasury')
      setCurrentAddress(response.address || '')
    } catch (err: any) {
      setError(err.message || 'Failed to load treasury address')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate() {
    // Validate address format
    const trimmedAddress = newAddress.trim()

    if (!trimmedAddress) {
      setError(t.settingsPage.addressRequired)
      return
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress)) {
      setError(t.settingsPage.invalidAddress)
      return
    }

    try {
      setUpdating(true)
      setError('')
      setSuccess('')

      await apiClient.put<UpdateResponse>('/admin/settings/treasury', {
        address: trimmedAddress,
      })

      setCurrentAddress(trimmedAddress.toLowerCase())
      setNewAddress('')
      setSuccess(t.settingsPage.updateSuccess)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || t.settingsPage.updateError)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.settingsPage.title}</h1>
        <p className="text-gray-600 mt-2">{t.settingsPage.description}</p>
      </div>

      {/* Treasury Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t.settingsPage.treasury}</CardTitle>
          <CardDescription>{t.settingsPage.treasuryDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : (
            <>
              {/* Current Address Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.settingsPage.currentAddress}
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm">
                  {currentAddress || (
                    <span className="text-gray-400 italic">{t.settingsPage.notConfigured}</span>
                  )}
                </div>
              </div>

              {/* Update Address Input */}
              <div>
                <label htmlFor="treasury-address" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.settingsPage.treasuryAddress}
                </label>
                <input
                  id="treasury-address"
                  type="text"
                  placeholder={t.settingsPage.treasuryAddressPlaceholder}
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  disabled={updating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-sm">
                  {success}
                </div>
              )}

              {/* Update Button */}
              <button
                onClick={handleUpdate}
                disabled={!newAddress.trim() || updating}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {updating ? t.settingsPage.updating : t.settingsPage.update}
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
