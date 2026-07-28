'use client'

import type { LevelNode } from '@pascal-app/core'
import { useEffect, useState } from 'react'
import type { LevelDuplicatePreset } from '../../lib/level-duplication'
import { getLevelDisplayName } from '@pascal-app/core'
import { type TranslationKey, useI18n } from '../../i18n'
import { cn } from '../../lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './primitives/dialog'

const DUPLICATE_PRESETS: Array<{
  id: LevelDuplicatePreset
  labelKey: TranslationKey
  descriptionKey: TranslationKey
}> = [
  {
    id: 'everything',
    labelKey: 'dialogs.duplicateLevel.presets.everythingLabel',
    descriptionKey: 'dialogs.duplicateLevel.presets.everythingDesc',
  },
  {
    id: 'structure',
    labelKey: 'dialogs.duplicateLevel.presets.structureLabel',
    descriptionKey: 'dialogs.duplicateLevel.presets.structureDesc',
  },
  {
    id: 'structure-materials',
    labelKey: 'dialogs.duplicateLevel.presets.structureMaterialsLabel',
    descriptionKey: 'dialogs.duplicateLevel.presets.structureMaterialsDesc',
  },
  {
    id: 'structure-furniture',
    labelKey: 'dialogs.duplicateLevel.presets.structureFurnitureLabel',
    descriptionKey: 'dialogs.duplicateLevel.presets.structureFurnitureDesc',
  },
]

export function LevelDuplicateDialog({
  open,
  level,
  onConfirm,
  onOpenChange,
}: {
  open: boolean
  level: LevelNode | null
  onConfirm: (preset: LevelDuplicatePreset) => void
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  const [preset, setPreset] = useState<LevelDuplicatePreset>('everything')

  useEffect(() => {
    if (open) {
      setPreset('everything')
    }
  }, [open])

  const levelLabel = level ? getLevelDisplayName(level) : t('dialogs.duplicateLevel.thisLevel')

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t('dialogs.duplicateLevel.title')}</DialogTitle>
          <DialogDescription>
            {t('dialogs.duplicateLevel.description', { level: levelLabel })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          {DUPLICATE_PRESETS.map((option) => (
            <button
              className={cn(
                'cursor-pointer rounded-xl border px-3 py-3 text-start transition-colors',
                preset === option.id
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-background hover:bg-accent/40',
              )}
              key={option.id}
              onClick={() => setPreset(option.id)}
              type="button"
            >
              <div className="font-medium text-sm">{t(option.labelKey)}</div>
              <div className="mt-1 text-muted-foreground text-xs">{t(option.descriptionKey)}</div>
            </button>
          ))}
        </div>

        <DialogFooter>
          <button
            className="cursor-pointer rounded-md px-4 py-2 text-muted-foreground text-sm transition-colors hover:bg-accent"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            {t('common.cancel')}
          </button>
          <button
            className="cursor-pointer rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm transition-opacity hover:opacity-90"
            onClick={() => onConfirm(preset)}
            type="button"
          >
            {t('dialogs.duplicateLevel.duplicate')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
