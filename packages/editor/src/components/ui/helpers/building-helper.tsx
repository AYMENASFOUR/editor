import { useI18n } from '../../../i18n'
import { ContextualHelperPanel } from './contextual-helper-panel'

interface BuildingHelperProps {
  showRotate?: boolean
}

// Rotate is one hint with both keys (R / T) — never two separate
// counterclockwise / clockwise rows — to match every other placement helper.
export function BuildingHelper({ showRotate }: BuildingHelperProps) {
  const { t } = useI18n()
  return (
    <ContextualHelperPanel
      hints={[
        { keys: ['Left click'], label: t('helper.placeBuilding') },
        ...(showRotate ? [{ keys: ['R', 'T'], label: t('menus.rotate') }] : []),
        { keys: ['Esc'], label: t('helper.cancel') },
      ]}
    />
  )
}
