'use client'

// Loads `@pascal-app/nodes`' built-in plugin into the node registry on the
// client. Mounted from `layout.tsx` so every page in the standalone
// editor gets the registry populated before its first `<Viewer>` /
// `<Editor>` mounts — without this the registry is empty on the client
// (the server registers in its own module instance, which is unreachable
// from hydrated pages) and every `NodeRenderer` resolves to `null`. The
// `loaded` guard inside `../lib/bootstrap` keeps the side effect
// idempotent under HMR.
import '../lib/bootstrap'
import { I18nProvider, type Locale } from '@pascal-app/editor/i18n'
import { type ReactNode, useEffect } from 'react'

export function ClientBootstrap({
  children,
  enableDevDiagnostics,
  locale,
}: {
  children: ReactNode
  enableDevDiagnostics: boolean
  // Resolved on the server from the locale cookie so the provider's first
  // render matches `<html lang dir>` and there is no hydration mismatch.
  locale: Locale
}) {
  useEffect(() => {
    if (!enableDevDiagnostics) return
    import('react-scan').then(({ scan }) => scan({ enabled: true }))
  }, [enableDevDiagnostics])
  return <I18nProvider initialLocale={locale}>{children}</I18nProvider>
}
