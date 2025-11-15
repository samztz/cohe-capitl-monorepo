import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Locale, translations } from '@/src/locales'

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: typeof translations.en
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: 'en',
      t: translations.en,
      setLocale: (locale: Locale) => {
        set({
          locale,
          t: translations[locale],
        })
      },
    }),
    {
      name: 'locale-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ensure translations are loaded after rehydration
          state.t = translations[state.locale]
        }
      },
    }
  )
)
