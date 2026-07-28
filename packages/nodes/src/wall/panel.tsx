'use client'

import {
  type AnyNode,
  type AnyNodeId,
  buildWallFaceBandCountPatch,
  getClampedWallCurveOffset,
  getMaxWallCurveOffset,
  getWallCurveLength,
  getWallFaceBandConfig,
  normalizeWallCurveOffset,
  useLiveNodeOverrides,
  useScene,
  WALL_CHAIR_RAIL_DEFAULT,
  WALL_CROWN_DEFAULT,
  WALL_FACE_BAND_DEFAULT,
  WALL_SKIRTING_DEFAULT,
  type WallAssemblyLayer,
  type WallAssemblyLayerRole,
  type WallDimensionDatum,
  type WallNode,
  type WallTrimProfile,
} from '@pascal-app/core'
import {
  ActionButton,
  ActionGroup,
  curveReshapeScope,
  formatLinearMeasurement,
  getLinearUnitLabel,
  linearControlValueToMeters,
  metersToLinearUnit,
  PanelSection,
  PanelWrapper,
  SegmentedControl,
  SliderControl,
  triggerSFX,
  useInteractionScope, useI18n, type TranslateFn} from '@pascal-app/editor'
import { useViewer } from '@pascal-app/viewer'
import { Plus, Spline, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useRef } from 'react'
import { resolveWallOpeningCeiling } from '../shared/wall-opening-ceiling'

type WallTrimKey = 'skirting' | 'crown' | 'chairRail'

const WALL_TRIM_PROFILE_OPTIONS = (t: TranslateFn): Record<
  WallTrimKey,
  Array<{ label: string; value: WallTrimProfile }>
> => ({
  skirting: [
    { label: t('np.flat'), value: 'flat' },
    { label: t('np.modern'), value: 'base-modern' },
    { label: t('np.colonial'), value: 'base-colonial' },
    { label: t('np.shoe'), value: 'base-shoe' },
    { label: t('np.ogee'), value: 'base-ogee' },
  ],
  crown: [
    { label: t('np.flat'), value: 'flat' },
    { label: t('np.cove'), value: 'crown-cove' },
    { label: t('np.ogee'), value: 'crown-ogee' },
    { label: t('np.craft'), value: 'crown-craftsman' },
    { label: t('np.layered'), value: 'crown-layered' },
  ],
  chairRail: [
    { label: t('np.flat'), value: 'flat' },
    { label: t('np.round'), value: 'rail-rounded' },
    { label: t('np.ogee'), value: 'rail-ogee' },
    { label: t('np.picture'), value: 'rail-picture' },
    { label: t('np.step'), value: 'rail-stepped' },
  ],
})

export default function WallPanel() {
  const { t } = useI18n()
  const selectedId = useViewer((s) => s.selection.selectedIds[0])
  const unit = useViewer((s) => s.unit)
  const setSelection = useViewer((s) => s.setSelection)

  const sceneNode = useScene((s) =>
    selectedId ? (s.nodes[selectedId as AnyNode['id']] as WallNode | undefined) : undefined,
  )

  // Live override published by the 2D drag handlers (side-arrows /
  // corner dots / curve handle). Merged on top of the scene node so
  // the sliders read the live `start` / `end` / `curveOffset` during
  // a drag without zustand being touched until commit.
  const liveOverride = useLiveNodeOverrides((s) =>
    selectedId ? s.get(selectedId as AnyNodeId) : undefined,
  )

  const node = useMemo<WallNode | undefined>(() => {
    if (!sceneNode) return undefined
    if (!liveOverride || Object.keys(liveOverride).length === 0) return sceneNode
    return { ...sceneNode, ...liveOverride } as WallNode
  }, [sceneNode, liveOverride])

  // Boolean selector — re-renders only when this specific wall's child
  // composition crosses the "has a door/window/wall-item" threshold.
  const hasWallChildrenBlockingCurve = useScene((s) => {
    if (!node) return false
    return (node.children ?? []).some((childId) => {
      const child = s.nodes[childId as AnyNodeId]
      if (!child) return false
      if (child.type === 'door' || child.type === 'window') return true
      if (child.type === 'item') {
        const attachTo = child.asset?.attachTo
        return attachTo === 'wall' || attachTo === 'wall-side'
      }
      return false
    })
  })

  // Effective height while the wall is plane-bound (`height` absent): the
  // storey plane minus the elected slab base — what the wall currently
  // renders at. `undefined` for walls with an explicit custom height.
  const planeBoundHeightMeters = useScene((s) => {
    const wall = selectedId ? (s.nodes[selectedId as AnyNodeId] as WallNode | undefined) : undefined
    if (wall?.type !== 'wall' || wall.height != null) return undefined
    return resolveWallOpeningCeiling(wall, s.nodes)
  })

  // Mirror the latest node into a ref so the slider handlers below have
  // stable identities across re-renders. Without this, every store tick
  // (one per pointermove during a slider drag) rebuilt the handler
  // refs, destabilising SliderControl's pointer-capture listeners and
  // combining with float drift in `getWallCurveLength` produced a
  // "Maximum update depth exceeded" cascade. Same fix in fence-panel.tsx.
  const nodeRef = useRef(node)
  nodeRef.current = node

  const handleUpdate = useCallback(
    (updates: Partial<WallNode>) => {
      if (!selectedId) return
      useScene.getState().updateNode(selectedId as AnyNode['id'], updates)
    },
    [selectedId],
  )

  const handleUpdateLength = useCallback(
    (newLength: number) => {
      const n = nodeRef.current
      if (!n || newLength <= 0) return

      const dx = n.end[0] - n.start[0]
      const dz = n.end[1] - n.start[1]
      const currentLength = Math.sqrt(dx * dx + dz * dz)

      if (currentLength === 0) return

      const dirX = dx / currentLength
      const dirZ = dz / currentLength

      const newEnd: [number, number] = [
        n.start[0] + dirX * newLength,
        n.start[1] + dirZ * newLength,
      ]

      handleUpdate({ end: newEnd })
    },
    [handleUpdate],
  )

  const handleTopModeChange = useCallback(
    (mode: 'storey' | 'custom') => {
      const n = nodeRef.current
      if (!n) return
      const isCustom = n.height != null
      if (mode === 'custom' && !isCustom) {
        // Seed from the current effective height so the geometry doesn't
        // jump at the moment of detaching from the storey plane.
        const seeded = resolveWallOpeningCeiling(n, useScene.getState().nodes)
        handleUpdate({ height: Math.max(0.1, seeded) })
      } else if (mode === 'storey' && isCustom) {
        // Absent `height` = plane-bound; the store strips undefined keys.
        handleUpdate({ height: undefined })
      }
    },
    [handleUpdate],
  )

  const handleClose = useCallback(() => {
    setSelection({ selectedIds: [] })
  }, [setSelection])

  const handleCurve = useCallback(() => {
    if (!node) return
    triggerSFX('sfx:item-pick')
    useInteractionScope.getState().begin(curveReshapeScope(node.id))
    setSelection({ selectedIds: [] })
  }, [node, setSelection])

  if (!(node && node.type === 'wall' && selectedId)) return null

  const length = getWallCurveLength(node)

  const isPlaneBound = node.height == null
  const height = node.height ?? planeBoundHeightMeters ?? 2.5
  const thickness = node.thickness ?? 0.1
  const curveOffset = getClampedWallCurveOffset(node)
  const maxCurveOffset = getMaxWallCurveOffset(node)
  const unitLabel = getLinearUnitLabel(unit)
  const displayLength = metersToLinearUnit(length, unit)
  const displayHeight = metersToLinearUnit(height, unit)
  const displayThickness = metersToLinearUnit(thickness, unit)
  const displayCurveOffset = metersToLinearUnit(curveOffset, unit)
  const displayMaxCurveOffset = metersToLinearUnit(maxCurveOffset, unit)
  const curveOffsetLimit = Math.max(0.01, maxCurveOffset)
  const wallHeightMeters = height

  const skirting = { ...WALL_SKIRTING_DEFAULT, ...(node.skirting ?? {}) }
  const crown = { ...WALL_CROWN_DEFAULT, ...(node.crown ?? {}) }
  const chairRail = { ...WALL_CHAIR_RAIL_DEFAULT, ...(node.chairRail ?? {}) }

  return (
    <PanelWrapper
      icon="/icons/wall.webp"
      onClose={handleClose}
      title={node.name || t('np.wall')}
      width={280}
    >
      <PanelSection title={t('np.dimensions')}>
        <SliderControl
          label={t('np.length')}
          max={metersToLinearUnit(20, unit)}
          min={metersToLinearUnit(0.1, unit)}
          onChange={(value) =>
            handleUpdateLength(
              linearControlValueToMeters(value, unit, { maxMeters: 20, minMeters: 0.1 }),
            )
          }
          precision={2}
          step={unit === 'imperial' ? 0.1 : 0.01}
          unit={unitLabel}
          value={displayLength}
        />
        <div className="px-1 font-medium text-[10px] text-muted-foreground/80 uppercase tracking-wider">
          {t('np.top')}
        </div>
        <SegmentedControl
          onChange={handleTopModeChange}
          options={[
            { label: t('np.followsLevel'), value: 'storey' },
            { label: t('np.customHeight'), value: 'custom' },
          ]}
          value={isPlaneBound ? 'storey' : 'custom'}
        />
        {isPlaneBound ? (
          <div className="px-1 text-[11px] text-muted-foreground">
            {t('np.currently')} {formatLinearMeasurement(height, unit)}
          </div>
        ) : (
          <SliderControl
            label={t('np.height')}
            max={metersToLinearUnit(6, unit)}
            min={metersToLinearUnit(0.1, unit)}
            onChange={(v) =>
              handleUpdate({
                height: linearControlValueToMeters(v, unit, { maxMeters: 6, minMeters: 0.1 }),
              })
            }
            precision={2}
            step={0.1}
            unit={unitLabel}
            value={Math.round(displayHeight * 100) / 100}
          />
        )}
        <SliderControl
          label={t('np.thickness')}
          max={metersToLinearUnit(1, unit)}
          min={metersToLinearUnit(0.05, unit)}
          onChange={(v) =>
            handleUpdate({
              thickness: linearControlValueToMeters(v, unit, { maxMeters: 1, minMeters: 0.05 }),
            })
          }
          precision={3}
          step={0.01}
          unit={unitLabel}
          value={Math.round(displayThickness * 1000) / 1000}
        />
        {!hasWallChildrenBlockingCurve && (
          <SliderControl
            label={t('np.curve')}
            max={Math.max(metersToLinearUnit(0.01, unit), displayMaxCurveOffset)}
            min={-Math.max(metersToLinearUnit(0.01, unit), displayMaxCurveOffset)}
            onChange={(v) =>
              handleUpdate({
                curveOffset: normalizeWallCurveOffset(
                  node,
                  linearControlValueToMeters(v, unit, {
                    maxMeters: curveOffsetLimit,
                    minMeters: -curveOffsetLimit,
                  }),
                ),
              })
            }
            precision={2}
            step={0.1}
            unit={unitLabel}
            value={Math.round(displayCurveOffset * 100) / 100}
          />
        )}
      </PanelSection>

      <WallAssemblySection node={node} onUpdate={handleUpdate} unit={unit} unitLabel={unitLabel} />

      <WallFaceBandSection
        node={node}
        onUpdate={handleUpdate}
        unit={unit}
        unitLabel={unitLabel}
        wallHeightMeters={wallHeightMeters}
      />

      <WallTrimSection
        node={node}
        onUpdate={handleUpdate}
        title={t('np.skirting')}
        trimKey="skirting"
        trimValue={skirting}
        unit={unit}
        unitLabel={unitLabel}
        wallHeightMeters={wallHeightMeters}
      />
      <WallTrimSection
        node={node}
        onUpdate={handleUpdate}
        title={t('np.crownMolding')}
        trimKey="crown"
        trimValue={crown}
        unit={unit}
        unitLabel={unitLabel}
        wallHeightMeters={wallHeightMeters}
      />
      <WallTrimSection
        node={node}
        onUpdate={handleUpdate}
        title={t('np.chairRail')}
        trimKey="chairRail"
        trimValue={chairRail}
        unit={unit}
        unitLabel={unitLabel}
        wallHeightMeters={wallHeightMeters}
      />

      {!hasWallChildrenBlockingCurve && (
        <PanelSection title={t('np.actions')}>
          <ActionGroup>
            <ActionButton
              icon={<Spline className="h-3.5 w-3.5" />}
              label={t('np.curve')}
              onClick={handleCurve}
            />
          </ActionGroup>
        </PanelSection>
      )}
    </PanelWrapper>
  )
}

const WALL_ASSEMBLY_ROLE_OPTIONS = (t: TranslateFn): Array<{ label: string; value: WallAssemblyLayerRole }> => [
  { label: t('np.structure'), value: 'structure' },
  { label: t('np.interiorFinish'), value: 'interior-finish' },
  { label: t('np.exteriorSheathing'), value: 'exterior-sheathing' },
  { label: t('np.exteriorFinish'), value: 'exterior-finish' },
  { label: t('np.masonryVeneer'), value: 'masonry-veneer' },
  { label: t('np.airSpace'), value: 'air-space' },
  { label: t('np.concreteBlock'), value: 'concrete-block' },
  { label: t('np.structuralMasonry'), value: 'structural-masonry' },
  { label: t('np.solidConcrete'), value: 'solid-concrete' },
  { label: t('np.furring'), value: 'furring' },
]

const WALL_DATUM_OPTIONS = (t: TranslateFn): Array<{ label: string; value: WallDimensionDatum }> => [
  { label: t('np.structural'), value: 'structural-face' },
  { label: t('np.finish'), value: 'finish-face' },
  { label: t('np.veneer'), value: 'veneer-face' },
]

function WallAssemblySection({
  node,
  onUpdate,
  unit,
  unitLabel,
}: {
  node: WallNode
  onUpdate: (updates: Partial<WallNode>) => void
  unit: 'metric' | 'imperial'
  unitLabel: string
}) {
  const { t } = useI18n()
  const layers = node.assemblyLayers ?? []
  const updateLayer = (index: number, patch: Partial<WallAssemblyLayer>) =>
    onUpdate({
      assemblyLayers: layers.map((layer, layerIndex) =>
        layerIndex === index ? { ...layer, ...patch } : layer,
      ),
    })
  const addLayer = () => {
    const number = layers.length + 1
    onUpdate({
      assemblyLayers: [
        ...layers,
        {
          id: `layer-${number}`,
          role: layers.length === 0 ? 'structure' : 'exterior-finish',
          side: layers.length === 0 ? 'core' : 'exterior',
          thickness: 0.1,
          materialRef: '',
          datumEligible: layers.length === 0 ? ['structural-face'] : ['finish-face'],
        },
      ],
    })
  }

  return (
    <PanelSection title={t('np.wallAssembly')}>
      <div className="space-y-2 px-1 pb-1">
        {layers.map((layer, index) => (
          <div className="space-y-2 rounded-lg border border-border/50 p-2" key={layer.id}>
            <div className="flex items-center gap-2">
              <input
                className="h-7 min-w-0 flex-1 rounded-md border border-border/50 bg-[#2C2C2E] px-2 text-xs outline-none"
                maxLength={80}
                onBlur={(event) => {
                  const id = event.currentTarget.value.trim()
                  if (id && id !== layer.id) updateLayer(index, { id })
                }}
                defaultValue={layer.id}
              />
              <button
                aria-label={`Remove ${layer.id}`}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() =>
                  onUpdate({
                    assemblyLayers: layers.filter((_, layerIndex) => layerIndex !== index),
                  })
                }
                type="button"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                className="h-7 rounded-md border border-border/50 bg-[#2C2C2E] px-1.5 text-xs outline-none"
                onChange={(event) =>
                  updateLayer(index, { role: event.currentTarget.value as WallAssemblyLayerRole })
                }
                value={layer.role}
              >
                {WALL_ASSEMBLY_ROLE_OPTIONS(t).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className="h-7 rounded-md border border-border/50 bg-[#2C2C2E] px-1.5 text-xs outline-none"
                onChange={(event) =>
                  updateLayer(index, {
                    side: event.currentTarget.value as WallAssemblyLayer['side'],
                  })
                }
                value={layer.side}
              >
                <option value="core">{t('np.core')}</option>
                <option value="interior">{t('np.interior')}</option>
                <option value="exterior">{t('np.exterior')}</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">{t('np.thickness')}</span>
              <input
                className="h-7 min-w-0 flex-1 rounded-md border border-border/50 bg-[#2C2C2E] px-2 font-mono outline-none"
                min={0.001}
                onBlur={(event) => {
                  const parsed = Number.parseFloat(event.currentTarget.value)
                  if (Number.isFinite(parsed) && parsed > 0) {
                    updateLayer(index, { thickness: linearControlValueToMeters(parsed, unit) })
                  }
                }}
                step={unit === 'imperial' ? 0.01 : 0.001}
                type="number"
                defaultValue={Math.round(metersToLinearUnit(layer.thickness, unit) * 1000) / 1000}
              />
              <span className="text-muted-foreground">{unitLabel}</span>
            </label>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {WALL_DATUM_OPTIONS(t).map((option) => (
                <label className="flex items-center gap-1 text-[10px]" key={option.value}>
                  <input
                    checked={layer.datumEligible.includes(option.value)}
                    onChange={(event) =>
                      updateLayer(index, {
                        datumEligible: event.currentTarget.checked
                          ? [...layer.datumEligible, option.value]
                          : layer.datumEligible.filter((datum) => datum !== option.value),
                      })
                    }
                    type="checkbox"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        ))}
        <button
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-border/50 text-xs hover:bg-muted"
          onClick={addLayer}
          type="button"
        >
          <Plus className="size-3.5" /> {t('np.addAssemblyLayer')}
        </button>
      </div>
    </PanelSection>
  )
}

function WallFaceBandSection({
  node,
  onUpdate,
  unit,
  unitLabel,
  wallHeightMeters,
}: {
  node: WallNode
  onUpdate: (updates: Partial<WallNode>) => void
  unit: 'metric' | 'imperial'
  unitLabel: string
  wallHeightMeters: number
}) {
  const { t } = useI18n()
  const bandConfig = getWallFaceBandConfig(node, wallHeightMeters)
  const bandCount = bandConfig.count
  const lowerHeight = bandConfig.lowerHeight
  const middleHeight = bandConfig.middleHeight
  const upperHeight = bandConfig.upperHeight
  const updateBands = (patch: Partial<NonNullable<WallNode['faceBands']>>) =>
    onUpdate({
      faceBands: {
        ...WALL_FACE_BAND_DEFAULT,
        ...(node.faceBands ?? {}),
        enabled: bandCount > 1,
        count: bandCount,
        ...patch,
      },
    })

  return (
    <PanelSection title={t('np.wallBands')}>
      <SliderControl
        label={t('np.bands')}
        max={4}
        min={1}
        onChange={(value) => onUpdate(buildWallFaceBandCountPatch(node, Math.round(value)))}
        precision={0}
        step={1}
        value={bandCount}
      />
      {bandCount >= 2 && (
        <SliderControl
          label={t('np.lower')}
          max={metersToLinearUnit(wallHeightMeters, unit)}
          min={metersToLinearUnit(0, unit)}
          onChange={(value) =>
            updateBands({
              lowerHeight: linearControlValueToMeters(value, unit, {
                maxMeters: wallHeightMeters,
                minMeters: 0,
              }),
            })
          }
          precision={2}
          step={0.01}
          unit={unitLabel}
          value={metersToLinearUnit(lowerHeight, unit)}
        />
      )}
      {bandCount >= 3 && (
        <SliderControl
          label={t('np.middle')}
          max={metersToLinearUnit(Math.max(0, wallHeightMeters - lowerHeight), unit)}
          min={metersToLinearUnit(0, unit)}
          onChange={(value) =>
            updateBands({
              middleHeight: linearControlValueToMeters(value, unit, {
                maxMeters: Math.max(0, wallHeightMeters - lowerHeight),
                minMeters: 0,
              }),
            })
          }
          precision={2}
          step={0.01}
          unit={unitLabel}
          value={metersToLinearUnit(middleHeight, unit)}
        />
      )}
      {bandCount >= 4 && (
        <SliderControl
          label={t('np.upper')}
          max={metersToLinearUnit(Math.max(0, wallHeightMeters - lowerHeight - middleHeight), unit)}
          min={metersToLinearUnit(0, unit)}
          onChange={(value) =>
            updateBands({
              upperHeight: linearControlValueToMeters(value, unit, {
                maxMeters: Math.max(0, wallHeightMeters - lowerHeight - middleHeight),
                minMeters: 0,
              }),
            })
          }
          precision={2}
          step={0.01}
          unit={unitLabel}
          value={metersToLinearUnit(upperHeight, unit)}
        />
      )}
    </PanelSection>
  )
}

function WallTrimSection({
  node,
  onUpdate,
  title,
  trimKey,
  trimValue,
  unit,
  unitLabel,
  wallHeightMeters,
}: {
  node: WallNode
  onUpdate: (updates: Partial<WallNode>) => void
  title: string
  trimKey: WallTrimKey
  trimValue: NonNullable<WallNode['skirting']>
  unit: 'metric' | 'imperial'
  unitLabel: string
  wallHeightMeters: number
}) {
  const { t } = useI18n()
  const updateTrim = (patch: Partial<NonNullable<WallNode['skirting']>>) =>
    onUpdate({
      [trimKey]: {
        ...trimValue,
        ...patch,
      },
    } as Partial<WallNode>)
  const profileOptions = WALL_TRIM_PROFILE_OPTIONS(t)[trimKey]
  const selectedProfile = profileOptions.some((option) => option.value === trimValue.profile)
    ? trimValue.profile
    : profileOptions[0]!.value

  return (
    <PanelSection title={title}>
      <ActionGroup>
        <ActionButton
          label={trimValue.enabled ? `Hide ${title.toLowerCase()}` : `Show ${title.toLowerCase()}`}
          onClick={() => updateTrim({ enabled: !trimValue.enabled })}
        />
      </ActionGroup>
      {trimValue.enabled && (
        <>
          <SegmentedControl
            onChange={(next) => updateTrim({ sides: next as any })}
            options={[
              { label: t('np.interior'), value: 'interior' },
              { label: t('np.exterior'), value: 'exterior' },
              { label: t('np.both'), value: 'both' },
            ]}
            value={trimValue.sides}
          />
          <SegmentedControl
            onChange={(next) => updateTrim({ profile: next })}
            options={profileOptions}
            value={selectedProfile}
          />
          <SliderControl
            label={t('np.height')}
            max={metersToLinearUnit(Math.max(0.05, wallHeightMeters), unit)}
            min={metersToLinearUnit(0.01, unit)}
            onChange={(value) =>
              updateTrim({
                height: linearControlValueToMeters(value, unit, {
                  maxMeters: Math.max(0.05, wallHeightMeters),
                  minMeters: 0.01,
                }),
              })
            }
            precision={2}
            step={0.01}
            unit={unitLabel}
            value={metersToLinearUnit(trimValue.height, unit)}
          />
          <SliderControl
            label={t('np.proud')}
            max={metersToLinearUnit(0.2, unit)}
            min={metersToLinearUnit(0.001, unit)}
            onChange={(value) =>
              updateTrim({
                proud: linearControlValueToMeters(value, unit, {
                  maxMeters: 0.2,
                  minMeters: 0.001,
                }),
              })
            }
            precision={3}
            step={0.005}
            unit={unitLabel}
            value={metersToLinearUnit(trimValue.proud, unit)}
          />
          {trimKey === 'chairRail' && (
            <SliderControl
              label={t('np.offset')}
              max={metersToLinearUnit(Math.max(0.05, wallHeightMeters - trimValue.height), unit)}
              min={metersToLinearUnit(0, unit)}
              onChange={(value) =>
                updateTrim({
                  offsetY: linearControlValueToMeters(value, unit, {
                    maxMeters: Math.max(0.05, wallHeightMeters - trimValue.height),
                    minMeters: 0,
                  }),
                })
              }
              precision={2}
              step={0.01}
              unit={unitLabel}
              value={metersToLinearUnit(trimValue.offsetY ?? 0, unit)}
            />
          )}
        </>
      )}
    </PanelSection>
  )
}
