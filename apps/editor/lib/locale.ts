import { cookies } from 'next/headers'
// Import from the lightweight i18n subpath (React + catalogs only) rather than
// the main barrel, so this server-side helper doesn't pull the R3F/three.js
// editor bundle into the root layout's server module graph.
import {
  createTranslator,
  DEFAULT_LOCALE,
  isLocale,
  type Locale,
  LOCALE_COOKIE,
  type TranslateFn,
} from '@pascal-app/editor/i18n'

// Reads the persisted UI locale from the request cookie so server components
// (root layout, marketing/legal pages) can render the correct language and set
// `<html lang dir>` on the first paint — avoiding a hydration flash when the
// client provider takes over. Falls back to English.
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
}

// Server-side translator bound to the request's locale, for translating text in
// Server Components (marketing/legal pages) without a client provider.
export async function getServerT(): Promise<TranslateFn> {
  return createTranslator(await getServerLocale())
}
