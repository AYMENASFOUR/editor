import { Languages } from 'lucide-react'
import { type Locale, useI18n } from '../../../../../i18n'
import { cn } from '../../../../../lib/utils'

const OPTIONS: { value: Locale; labelKey: 'settings.language.english' | 'settings.language.arabic' }[] =
  [
    { value: 'en', labelKey: 'settings.language.english' },
    { value: 'ar', labelKey: 'settings.language.arabic' },
  ]

// Segmented English ⇄ العربية toggle. Switching locale updates the message
// catalog, persists the choice (cookie + localStorage), and flips `<html dir>`
// so the chrome re-lays out RTL for Arabic.
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs uppercase">
        <Languages className="size-3.5" />
        {t('settings.language.label')}
      </label>
      <div className="inline-flex w-full rounded-md border border-border p-0.5">
        {OPTIONS.map((option) => {
          const active = locale === option.value
          return (
            <button
              className={cn(
                'flex-1 rounded-sm px-3 py-1.5 text-sm transition-colors',
                active
                  ? 'bg-accent font-medium text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              key={option.value}
              onClick={() => setLocale(option.value)}
              type="button"
            >
              {t(option.labelKey)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
