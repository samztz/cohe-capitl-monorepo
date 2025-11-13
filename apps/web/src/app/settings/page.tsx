'use client'

import { useState } from 'react'
import Image from 'next/image'
import BottomNav from '@/components/BottomNav'

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [language, setLanguage] = useState('en')

  const handleDisconnect = () => {
    // Mock disconnect - will be implemented with actual wallet logic later
    alert('Wallet disconnected')
  }

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
          label: 'Profile',
          value: '0xAB...B064',
          action: () => {},
        },
        {
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
          label: 'Email',
          value: 'user@example.com',
          action: () => {},
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          ),
          label: 'Notifications',
          value: notifications ? 'On' : 'Off',
          action: () => setNotifications(!notifications),
          toggle: true,
        },
        {
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          ),
          label: 'Language',
          value: language === 'en' ? 'English' : 'Chinese',
          action: () => {},
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ),
          label: 'Change Password',
          value: '',
          action: () => {},
        },
        {
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
          label: 'Two-Factor Auth',
          value: 'Disabled',
          action: () => {},
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          label: 'Help Center',
          value: '',
          action: () => {},
        },
        {
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          label: 'Terms & Privacy',
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
            COHE.CAPITL
          </span>
        </div>
        <div className="bg-[#FFD54F] text-[#0F111A] px-4 py-1.5 rounded-lg text-sm font-semibold h-8 flex items-center">
          0xAB...B064
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-5 pt-4 overflow-y-auto">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold mb-1">Settings</h1>
          <p className="text-[#9CA3AF] text-sm">
            Manage your account and preferences
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
            <span className="text-[#9CA3AF] text-sm">App Version</span>
            <span className="text-white text-sm font-semibold">1.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#9CA3AF] text-sm">Chain</span>
            <span className="text-white text-sm font-semibold">BSC Mainnet</span>
          </div>
        </div>

        {/* Disconnect Button */}
        <button
          onClick={handleDisconnect}
          className="w-full bg-red-500/10 text-red-500 px-6 py-4 rounded-lg font-semibold text-sm border border-red-500/50 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Disconnect Wallet
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
