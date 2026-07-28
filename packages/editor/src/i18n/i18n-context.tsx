'use client'

// Lightweight i18n layer for the editor. Intentionally dependency-free (no
// react-i18next / next-intl) because `@pascal-app/editor` is published and
// consumed by embedders — a heavy i18n runtime would be forced on them. It
// provides a React context, a typed `t()`, and reading-direction handling.
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { ar } from './messages/ar'
import { en, type Messages } from './messages/en'
import {
  DEFAULT_LOCALE,
  type Direction,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_DIRECTION,
  LOCALE_STORAGE_KEY,
  type Locale,
} from './types'

const CATALOGS: Record<Locale, Messages> = { en, ar }

// All dotted leaf paths of the message catalog, e.g. `'settings.language.label'`.
// Gives `t()` autocomplete and rejects typos at compile time.
type Leaves<T> = T extends string
  ? ''
  : {
      [K in keyof T & string]: Leaves<T[K]> extends infer R extends string
        ? R extends ''
          ? K
          : `${K}.${R}`
        : never
    }[keyof T & string]

export type TranslationKey = Leaves<Messages>

type Vars = Record<string, string | number>

function resolve(catalog: Messages, key: string): string | undefined {
  let node: unknown = catalog
  for (const part of key.split('.')) {
    if (node && typeof node === 'object' && part in (node as object)) {
      node = (node as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return typeof node === 'string' ? node : undefined
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

export type TranslateFn = (key: TranslationKey, vars?: Vars) => string

type I18nContextValue = {
  locale: Locale
  dir: Direction
  setLocale: (locale: Locale) => void
  t: TranslateFn
}

const I18nContext = createContext<I18nContextValue | null>(null)

function writeCookie(locale: Locale) {
  // 1 year, root path so every route (including server-rendered pages) reads it.
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
}

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode
  // Passed from the server (read from the locale cookie in `layout.tsx`) so the
  // first client render matches the server and there is no hydration flash.
  initialLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next)
    } catch {
      // localStorage can throw in private modes; the cookie still persists it.
    }
    writeCookie(next)
    const root = document.documentElement
    root.lang = next
    root.dir = LOCALE_DIRECTION[next]
  }, [])

  // Keep `<html lang dir>` in sync with the active locale on mount and change.
  // The server already sets these from the cookie; this covers client-only
  // transitions and the localStorage-preferred value.
  useEffect(() => {
    const root = document.documentElement
    root.lang = locale
    root.dir = LOCALE_DIRECTION[locale]
  }, [locale])

  const t = useCallback<TranslateFn>(
    (key, vars) => {
      const value = resolve(CATALOGS[locale], key) ?? resolve(CATALOGS.en, key) ?? key
      return interpolate(value, vars)
    },
    [locale],
  )

  const value = useMemo<I18nContextValue>(
    () => ({ locale, dir: LOCALE_DIRECTION[locale], setLocale, t }),
    [locale, setLocale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    // Fall back to English rather than crashing embedders that mount editor
    // components outside an `<I18nProvider>`.
    return {
      locale: DEFAULT_LOCALE,
      dir: LOCALE_DIRECTION[DEFAULT_LOCALE],
      setLocale: () => {},
      t: (key, vars) => interpolate(resolve(en, key) ?? key, vars),
    }
  }
  return ctx
}

// Convenience hook when only the translate function is needed.
export function useTranslate(): TranslateFn {
  return useI18n().t
}

export { isLocale, LOCALE_COOKIE, LOCALE_STORAGE_KEY, DEFAULT_LOCALE, LOCALE_DIRECTION }
export type { Locale, Direction }
