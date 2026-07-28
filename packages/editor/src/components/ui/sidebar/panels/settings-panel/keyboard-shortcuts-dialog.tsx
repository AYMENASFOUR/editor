import { Keyboard } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from './../../../../../components/ui/primitives/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './../../../../../components/ui/primitives/dialog'
import { ShortcutToken } from './../../../../../components/ui/primitives/shortcut-token'
import { type TranslationKey, useI18n } from '../../../../../i18n'

type Shortcut = {
  keys: string[]
  /** Id under `shortcuts.items.*` in the message catalog. */
  id: string
  /** Whether this shortcut has a `.note` translation to render. */
  hasNote?: boolean
}

type ShortcutCategory = {
  titleKey: TranslationKey
  shortcuts: Shortcut[]
}

const KEY_DISPLAY_MAP: Record<string, string> = {
  'Arrow Up': '↑',
  'Arrow Down': '↓',
  Esc: '⎋',
  Shift: '⇧',
  Space: '␣',
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    titleKey: 'shortcuts.categories.editorNav',
    shortcuts: [
      { keys: ['1'], id: 'sitePhase' },
      { keys: ['2'], id: 'structurePhase' },
      { keys: ['3'], id: 'furnishPhase' },
      { keys: ['F'], id: 'furnishLayer' },
      { keys: ['Z'], id: 'zonesLayer' },
      { keys: ['Cmd/Ctrl', 'Arrow Up'], id: 'nextLevel' },
      { keys: ['Cmd/Ctrl', 'Arrow Down'], id: 'prevLevel' },
      { keys: ['Cmd/Ctrl', 'B'], id: 'toggleSidebar' },
    ],
  },
  {
    titleKey: 'shortcuts.categories.modesHistory',
    shortcuts: [
      { keys: ['V'], id: 'selectMode' },
      { keys: ['B'], id: 'buildMode' },
      { keys: ['M'], id: 'lastMeasure' },
      { keys: ['X'], id: 'deleteMode' },
      { keys: ['Esc'], id: 'cancelTool' },
      { keys: ['Delete / Backspace'], id: 'deleteObjects' },
      { keys: ['Cmd/Ctrl', 'Z'], id: 'undo' },
      { keys: ['Cmd/Ctrl', 'Shift', 'Z'], id: 'redo' },
    ],
  },
  {
    titleKey: 'shortcuts.categories.selection',
    shortcuts: [
      { keys: ['Cmd/Ctrl', 'C'], id: 'copy', hasNote: true },
      { keys: ['Cmd/Ctrl', 'X'], id: 'cut', hasNote: true },
      { keys: ['Cmd/Ctrl', 'V'], id: 'paste', hasNote: true },
      { keys: ['Cmd/Ctrl', 'Left click'], id: 'addRemoveMulti', hasNote: true },
      { keys: ['Shift', 'Left click'], id: 'addRemoveCanvasMulti', hasNote: true },
      { keys: ['Left click'], id: 'moveMulti', hasNote: true },
      { keys: ['R', 'T'], id: 'rotateMulti', hasNote: true },
      { keys: ['Esc'], id: 'clearSelection', hasNote: true },
    ],
  },
  {
    titleKey: 'shortcuts.categories.directManip',
    shortcuts: [
      { keys: ['Cmd/Ctrl', 'Left click'], id: 'moveUnderCursor', hasNote: true },
      { keys: ['Cmd/Ctrl', 'Right click'], id: 'rotateUnderCursor', hasNote: true },
      { keys: ['Cmd/Ctrl', 'Shift', 'Right click'], id: 'rotateFreely', hasNote: true },
    ],
  },
  {
    titleKey: 'shortcuts.categories.drawingTools',
    shortcuts: [
      { keys: ['Shift'], id: 'bypassSnapping', hasNote: true },
      { keys: ['Shift'], id: 'rotateFreelySnap', hasNote: true },
    ],
  },
  {
    titleKey: 'shortcuts.categories.itemPlacement',
    shortcuts: [
      { keys: ['R', 'T'], id: 'rotateItem' },
      { keys: ['E'], id: 'operateNode' },
      { keys: ['Shift'], id: 'bypassPlacement', hasNote: true },
    ],
  },
  {
    titleKey: 'shortcuts.categories.camera',
    shortcuts: [
      { keys: ['W', 'A', 'S', 'D'], id: 'panWasd', hasNote: true },
      { keys: ['Middle click'], id: 'panMiddle', hasNote: true },
      { keys: ['Right click'], id: 'orbit', hasNote: true },
    ],
  },
]

function getDisplayKey(key: string, isMac: boolean): string {
  if (key === 'Cmd/Ctrl') return isMac ? '⌘' : 'Ctrl'
  if (key === 'Delete / Backspace') return isMac ? '⌫' : 'Backspace'
  return KEY_DISPLAY_MAP[key] ?? key
}

function ShortcutKeys({ keys }: { keys: string[] }) {
  const [isMac, setIsMac] = useState(true)

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-1">
      {keys.map((key, index) => (
        <div className="flex items-center gap-1" key={`${key}-${index}`}>
          {index > 0 ? <span className="text-[10px] text-muted-foreground">+</span> : null}
          <ShortcutToken displayValue={getDisplayKey(key, isMac)} value={key} />
        </div>
      ))}
    </div>
  )
}

export function KeyboardShortcutsDialog() {
  const { t } = useI18n()
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full justify-start gap-2" variant="outline">
          <Keyboard className="size-4" />
          {t('shortcuts.trigger')}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>{t('shortcuts.title')}</DialogTitle>
          <DialogDescription>{t('shortcuts.description')}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
          {SHORTCUT_CATEGORIES.map((category) => (
            <section className="space-y-2" key={category.titleKey}>
              <h3 className="font-medium text-sm">{t(category.titleKey)}</h3>
              <div className="overflow-hidden rounded-md border border-border/80">
                {category.shortcuts.map((shortcut, index) => (
                  <div
                    className="grid grid-cols-[minmax(130px,220px)_1fr] gap-3 px-3 py-2"
                    key={`${category.titleKey}-${shortcut.id}`}
                  >
                    <ShortcutKeys keys={shortcut.keys} />
                    <div>
                      <p className="text-sm">
                        {t(`shortcuts.items.${shortcut.id}.action` as TranslationKey)}
                      </p>
                      {shortcut.hasNote ? (
                        <p className="text-muted-foreground text-xs">
                          {t(`shortcuts.items.${shortcut.id}.note` as TranslationKey)}
                        </p>
                      ) : null}
                    </div>
                    {index < category.shortcuts.length - 1 ? (
                      <div className="col-span-2 border-border/60 border-b" />
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
