import { en } from './en'
import { zhTW } from './zh-TW'

export type Locale = 'en' | 'zh-TW'

export const translations = {
  en,
  'zh-TW': zhTW,
}

export { en, zhTW }
