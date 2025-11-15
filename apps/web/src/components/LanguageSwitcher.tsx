/**
 * Language Switcher Component
 * Allows users to switch between English and Traditional Chinese
 */

'use client'

import { useLocaleStore, useCurrentLocale } from '@/store/localeStore'
import { Locale, localeNames } from '@/locales'

interface LanguageSwitcherProps {
  variant?: 'button' | 'compact'
  className?: string
}

export function LanguageSwitcher({ variant = 'button', className = '' }: LanguageSwitcherProps) {
  const locale = useCurrentLocale()
  const setLocale = useLocaleStore((state) => state.setLocale)

  const toggleLanguage = () => {
    const newLocale: Locale = locale === 'en' ? 'zh-TW' : 'en'
    setLocale(newLocale)
  }

  if (variant === 'compact') {
    // Compact version - just shows language code
    return (
      <button
        onClick={toggleLanguage}
        className={`px-3 py-1.5 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-all border border-white/20 ${className}`}
        aria-label="Switch Language"
      >
        {locale === 'en' ? '中' : 'EN'}
      </button>
    )
  }

  // Full button version
  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-all border border-white/20 ${className}`}
      aria-label="Switch Language"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
      <span>{localeNames[locale === 'en' ? 'zh-TW' : 'en']}</span>
    </button>
  )
}
