/**
 * Locale Store - Language/Internationalization State Management
 * Uses Zustand for state management and localStorage for persistence
 */

import { create } from 'zustand'
import { Locale, locales, defaultLocale } from '@/locales'

const LOCALE_STORAGE_KEY = 'app_locale'

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
  loadStoredLocale: () => void
  t: typeof locales.en // Type for translations
}

/**
 * Storage utilities for web (localStorage)
 */
const storage = {
  setItem(key: string, value: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value)
    }
  },

  getItem(key: string): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key)
    }
    return null
  },
}

/**
 * Global locale store using Zustand
 */
export const useLocaleStore = create<LocaleState>((set, get) => ({
  // Initial state
  locale: defaultLocale,
  t: locales[defaultLocale],

  // Set locale and persist to localStorage
  setLocale: (locale: Locale) => {
    try {
      // Validate locale
      if (!locales[locale]) {
        console.error(`[LocaleStore] Invalid locale: ${locale}`)
        return
      }

      // Store locale
      storage.setItem(LOCALE_STORAGE_KEY, locale)

      // Update state
      set({
        locale,
        t: locales[locale],
      })

      console.log(`[LocaleStore] Locale changed to: ${locale}`)
    } catch (error) {
      console.error('[LocaleStore] Failed to set locale:', error)
    }
  },

  // Load stored locale on app startup
  loadStoredLocale: () => {
    try {
      const storedLocale = storage.getItem(LOCALE_STORAGE_KEY) as Locale | null

      if (storedLocale && locales[storedLocale]) {
        set({
          locale: storedLocale,
          t: locales[storedLocale],
        })
        console.log(`[LocaleStore] Loaded stored locale: ${storedLocale}`)
      } else {
        console.log(`[LocaleStore] Using default locale: ${defaultLocale}`)
      }
    } catch (error) {
      console.error('[LocaleStore] Failed to load stored locale:', error)
    }
  },
}))

/**
 * Hook to get translations
 */
export const useTranslations = () => {
  return useLocaleStore((state) => state.t)
}

/**
 * Hook to get current locale
 */
export const useCurrentLocale = () => {
  return useLocaleStore((state) => state.locale)
}
