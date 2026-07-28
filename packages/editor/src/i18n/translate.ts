// Pure translation logic — NO `'use client'`, no React. Shared by the client
// context (`./i18n-context`) and by Server Components (which build a translator
// directly via `createTranslator`). Keeping this framework-free is what lets
// the root layout / marketing pages translate on the server without dragging a
// client module (and its client-reference semantics) into the server graph.
import { ar } from './messages/ar'
import { en, type Messages } from './messages/en'
import type { Locale } from './types'

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

export type Vars = Record<string, string | number>

export type TranslateFn = (key: TranslationKey, vars?: Vars) => string

export function resolve(catalog: Messages, key: string): string | undefined {
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

export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

// Build a translator bound to a locale. Falls back to English, then to the raw
// key, so a missing translation degrades gracefully instead of throwing.
export function createTranslator(locale: Locale): TranslateFn {
  return (key, vars) => {
    const value = resolve(CATALOGS[locale], key) ?? resolve(CATALOGS.en, key) ?? key
    return interpolate(value, vars)
  }
}
