import type { TranslationKey } from '../../../i18n'
import type { CatalogCategory } from './../../../store/use-editor'

export type FurnishToolConfig = {
  id: 'item'
  iconSrc: string
  labelKey: TranslationKey
  catalogCategory: CatalogCategory
}

export const furnishTools: FurnishToolConfig[] = [
  {
    id: 'item',
    iconSrc: '/icons/couch.webp',
    labelKey: 'furnish.furniture',
    catalogCategory: 'furniture',
  },
  {
    id: 'item',
    iconSrc: '/icons/appliance.webp',
    labelKey: 'furnish.appliance',
    catalogCategory: 'appliance',
  },
  {
    id: 'item',
    iconSrc: '/icons/kitchen.webp',
    labelKey: 'furnish.kitchen',
    catalogCategory: 'kitchen',
  },
  {
    id: 'item',
    iconSrc: '/icons/bathroom.webp',
    labelKey: 'furnish.bathroom',
    catalogCategory: 'bathroom',
  },
  {
    id: 'item',
    iconSrc: '/icons/tree.webp',
    labelKey: 'furnish.outdoor',
    catalogCategory: 'outdoor',
  },
]
