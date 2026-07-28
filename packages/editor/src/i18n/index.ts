// Public i18n surface for `@pascal-app/editor`. Consumers (the standalone app
// and embedders) wrap their tree in `<I18nProvider>` and read text via
// `useI18n()` / `useTranslate()`.
//
// IMPORTANT: source the pure constants/types/helpers from `./types` (which has
// NO `'use client'` directive), not from `./i18n-context`. Re-exporting a value
// *through* a `'use client'` module turns it into a client-reference proxy when
// imported by a Server Component (e.g. the root layout / server locale helper),
// which then crashes at request time. Types are erased at runtime, so exporting
// them from the client module is harmless.
export {
  DEFAULT_LOCALE,
  type Direction,
  isLocale,
  type Locale,
  LOCALE_COOKIE,
  LOCALE_DIRECTION,
  LOCALE_STORAGE_KEY,
} from './types'
export {
  I18nProvider,
  type TranslateFn,
  type TranslationKey,
  useI18n,
  useTranslate,
} from './i18n-context'
export { ar } from './messages/ar'
export { en, type Messages } from './messages/en'
