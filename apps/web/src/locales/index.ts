/**
 * Localization Configuration
 * Centralized export for all translations
 */

import { en } from './en'
import { zhTW } from './zh-TW'

export type Locale = 'en' | 'zh-TW'

export const locales = {
  en,
  'zh-TW': zhTW,
} as const

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  'zh-TW': '繁體中文',
}

// Export types
export type { Translations } from './en'
