// Public i18n surface for `@pascal-app/editor`. Consumers (the standalone app
// and embedders) wrap their tree in `<I18nProvider>` and read text via
// `useI18n()` / `useTranslate()`.
export {
  DEFAULT_LOCALE,
  type Direction,
  I18nProvider,
  isLocale,
  type Locale,
  LOCALE_COOKIE,
  LOCALE_DIRECTION,
  LOCALE_STORAGE_KEY,
  type TranslateFn,
  type TranslationKey,
  useI18n,
  useTranslate,
} from './i18n-context'
export { ar } from './messages/ar'
export { en, type Messages } from './messages/en'
