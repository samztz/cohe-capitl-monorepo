'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAppKit, useAppKitAccount, useDisconnect } from '@reown/appkit/react'
import { useAuthStore } from '@/store/authStore'
import { resetAuth } from '@/lib/resetAuth'
import { useTranslations, useLocaleStore, useCurrentLocale } from '@/store/localeStore'
import { localeNames } from '@/locales'
import BottomNav from '@/components/BottomNav'

export default function SettingsPage() {
  const router = useRouter()
  const { close } = useAppKit()
  const { disconnect } = useDisconnect()
  const { address } = useAppKitAccount()
  const { user, logout: logoutStore } = useAuthStore()

  // Translations
  const t = useTranslations()
  const locale = useCurrentLocale()
  const setLocale = useLocaleStore((state) => state.setLocale)

  const [notifications, setNotifications] = useState(true)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Format wallet address for display (0xABCD...1234)
  const formatAddress = (addr: string | undefined) => {
    if (!addr) return t.settings.notConnected
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Toggle language
  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'zh-TW' : 'en'
    setLocale(newLocale)
  }

  const confirmDisconnect = async () => {
    try {
      setIsDisconnecting(true)
      setShowConfirmDialog(false)
      console.log('[SettingsPage] Starting disconnect process...')

      // Step 1: Disconnect wallet via AppKit (calls WalletConnect disconnect)
      console.log('[SettingsPage] Disconnecting AppKit wallet...')
      await disconnect()

      // Step 2: Clear all storage and WalletConnect cache
      console.log('[SettingsPage] Clearing storage and cache...')
      const result = await resetAuth({ close })

      // Step 3: Clear auth store
      console.log('[SettingsPage] Clearing auth store...')
      logoutStore()

      console.log('[SettingsPage] Disconnect successful:', result)

      // Step 4: Redirect to connect page
      router.push('/auth/connect')
    } catch (error) {
      console.error('[SettingsPage] Disconnect error:', error)
      alert('Failed to disconnect. Please try again.')
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleDisconnect = () => {
    setShowConfirmDialog(true)
  }

  const settingsSections = [
    {
      title: t.settings.accountSection,
      items: [
        {
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
          label: t.settings.walletAddress,
          value: formatAddress(address || user?.address),
          action: () => {},
        },
        {
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
          label: t.settings.email,
          value: 'user@example.com',
          action: () => {},
        },
      ],
    },
    {
      title: t.settings.preferencesSection,
      items: [
        {
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          ),
          label: t.settings.notifications,
          value: notifications ? t.common.on : t.common.off,
          action: () => setNotifications(!notifications),
          toggle: true,
        },
        {
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          ),
          label: t.settings.language,
          value: localeNames[locale],
          action: toggleLanguage,
        },
      ],
    },
    {
      title: t.settings.securitySection,
      items: [
        {
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ),
          label: t.settings.changePassword,
          value: '',
          action: () => {},
        },
        {
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
          label: t.settings.twoFactorAuth,
          value: t.settings.disabled,
          action: () => {},
        },
      ],
    },
    {
      title: t.settings.supportSection,
      items: [
        {
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          label: t.settings.helpCenter,
          value: '',
          action: () => {},
        },
        {
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          label: t.settings.termsAndPrivacy,
          value: '',
          action: () => {},
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-[#0F111A] flex flex-col pb-20">
      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/assets/cohe-capitl-app-logo.png"
            alt="Cohe Capital Logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-white text-base font-semibold tracking-wide">
            {t.common.appName}
          </span>
        </div>
        <div className="bg-[#FFD54F] text-[#0F111A] px-4 py-1.5 rounded-lg text-sm font-semibold h-8 flex items-center">
          {formatAddress(address || user?.address)}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-5 pt-4 overflow-y-auto">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold mb-1">{t.nav.settings}</h1>
          <p className="text-[#9CA3AF] text-sm">
            {t.settings.description}
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6 mb-6">
          {settingsSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h2 className="text-white text-sm font-semibold mb-3 uppercase tracking-wide">
                {section.title}
              </h2>
              <div className="bg-[#1A1D2E] rounded-lg border border-[#374151] overflow-hidden">
                {section.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={item.action}
                    className={`w-full px-4 py-4 flex items-center justify-between hover:bg-[#2D3748] transition-all ${
                      itemIndex !== section.items.length - 1 ? 'border-b border-[#374151]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-[#9CA3AF]">{item.icon}</div>
                      <span className="text-white text-sm font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.value && (
                        <span className="text-[#9CA3AF] text-sm">{item.value}</span>
                      )}
                      {item.toggle ? (
                        <div
                          className={`w-11 h-6 rounded-full transition-all ${
                            notifications ? 'bg-[#FFD54F]' : 'bg-[#374151]'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-all ${
                              notifications ? 'translate-x-6' : 'translate-x-0.5'
                            } mt-0.5`}
                          />
                        </div>
                      ) : (
                        <svg
                          className="w-5 h-5 text-[#9CA3AF]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* App Info */}
        <div className="bg-[#1A1D2E] rounded-lg p-4 border border-[#374151] mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#9CA3AF] text-sm">{t.settings.appVersion}</span>
            <span className="text-white text-sm font-semibold">0.5.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-semibold">
              {process.env.NEXT_PUBLIC_CHAIN_ID === '97' ? t.settings.chainTestnet : t.settings.chainMainnet}
            </span>
          </div>
        </div>

        {/* Disconnect Button */}
        <button
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          className="w-full bg-red-500/10 text-red-500 px-6 py-4 rounded-lg font-semibold text-sm border border-red-500/50 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDisconnecting ? (
            <>
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              {t.settings.disconnecting}
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t.settings.disconnectWallet}
            </>
          )}
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-5">
          <div className="bg-[#1A1D2E] rounded-2xl p-6 max-w-sm w-full border border-[#374151] shadow-xl">
            {/* Icon */}
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            {/* Title */}
            <h3 className="text-white text-xl font-bold text-center mb-2">
              {t.settings.disconnectTitle}
            </h3>

            {/* Description */}
            <p className="text-[#9CA3AF] text-sm text-center mb-6">
              {t.settings.disconnectMessage}
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                disabled={isDisconnecting}
                className="flex-1 bg-[#374151] text-white px-4 py-3 rounded-lg font-semibold text-sm hover:bg-[#4B5563] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={confirmDisconnect}
                disabled={isDisconnecting}
                className="flex-1 bg-red-500 text-white px-4 py-3 rounded-lg font-semibold text-sm hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDisconnecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t.settings.disconnecting}</span>
                  </>
                ) : (
                  t.common.disconnect
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
