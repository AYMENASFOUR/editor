import { useI18n } from '../../../i18n'
import type { SnapContext } from '../../../lib/snapping-mode'
import { ContextualHelperPanel } from './contextual-helper-panel'

export function RoofHelper({ snapContext }: { snapContext?: SnapContext | null }) {
  const { t } = useI18n()
  return (
    <ContextualHelperPanel
      hints={[
        { keys: ['Left click'], label: t('helper.setCorner') },
        { keys: ['Esc'], label: t('helper.cancel') },
      ]}
      snapContext={snapContext}
    />
  )
}
