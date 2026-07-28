import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, isLocale, type Locale, LOCALE_COOKIE } from '@pascal-app/editor'

// Reads the persisted UI locale from the request cookie so server components
// (root layout, marketing/legal pages) can render the correct language and set
// `<html lang dir>` on the first paint — avoiding a hydration flash when the
// client provider takes over. Falls back to English.
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
}
