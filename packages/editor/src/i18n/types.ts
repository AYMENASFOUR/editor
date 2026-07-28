// Locale identifiers supported by the editor UI. English is the source of
// truth for the message catalog; every other locale's shape is derived from
// it (see `Messages` in `./messages/en`) so a missing key is a type error.
export type Locale = 'en' | 'ar'

// Text direction for a locale. Only the reading direction of the editor's
// chrome flips — the 3D canvas and its in-scene overlays stay LTR (they are
// spatial, not textual).
export type Direction = 'ltr' | 'rtl'

export const LOCALE_DIRECTION: Record<Locale, Direction> = {
  en: 'ltr',
  ar: 'rtl',
}

export const DEFAULT_LOCALE: Locale = 'en'

// Cookie the server reads in `layout.tsx` to set `<html lang dir>` on the
// first paint, and that `setLocale` writes so the choice survives reloads
// without a hydration flash. Mirrored to `localStorage` for client reads.
export const LOCALE_COOKIE = 'pascal_locale'
export const LOCALE_STORAGE_KEY = 'pascal_locale'

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'ar'
}
