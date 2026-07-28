'use client'

import type {
  AnyNodeId,
  CabinetModuleNode as CabinetModuleNodeType,
  CabinetNode as CabinetNodeType,
} from '@pascal-app/core'
import { createSceneApi, useScene } from '@pascal-app/core'
import {
  ActionButton,
  PanelSection,
  PanelWrapper,
  SegmentedControl,
  SliderControl,
  ToggleControl, useI18n, type TranslateFn} from '@pascal-app/editor'
import { useViewer } from '@pascal-app/viewer'
import { Plus, Trash } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import {
  addCabinetModuleSide,
  backAlignZ,
  bumpCabinetRunLayoutRevision,
  cabinetMetadataRecord,
  cornerLinkedSourceModuleForRun,
  runModuleBaseY,
  syncCornerRunsFromSourceModule,
  syncCornerStyleGroupFromRun,
  wallChildOf,
} from './run-ops'
import {
  backAnchoredModuleZ,
  minCabinetCarcassHeightForStack,
  reflowCabinetRunModules,
  stackForCabinet,
} from './stack'

export type CabinetEditableNode = CabinetNodeType | CabinetModuleNodeType
const RUN_POSITION_PATCH_KEYS = new Set<keyof CabinetNodeType>(['showPlinth', 'plinthHeight'])
const RUN_MODULE_SYNC_PATCH_KEYS = new Set<keyof CabinetNodeType>([
  'frontStyle',
  'frontOverlay',
  'handleStyle',
  'handlePosition',
])
const RUN_DEPTH_PATCH_KEY = 'depth'
const PRESET_WIDTH_DEBT_KEY = 'cabinetPresetWidthDebtBySource'

const FRONT_STYLE_OPTIONS = (t: TranslateFn) => [
  { value: 'slab', label: t('np.slab') },
  { value: 'shaker', label: t('np.shaker') },
  { value: 'raised-arch', label: t('np.raisedArch') },
] as const

const FRONT_OVERLAY_OPTIONS = (t: TranslateFn) => [
  { value: 'full', label: t('np.overlay') },
  { value: 'inset', label: t('np.inset') },
] as const

const HANDLE_STYLE_OPTIONS = (t: TranslateFn) => [
  { value: 'bar', label: t('np.bar') },
  { value: 'knob', label: t('np.knob') },
  { value: 'cutout', label: t('np.cutout') },
  { value: 'hole', label: t('np.hole') },
  { value: 'none', label: t('np.none') },
] as const

const HANDLE_POSITION_OPTIONS = (t: TranslateFn) => [
  { value: 'auto', label: t('np.auto') },
  { value: 'top', label: t('np.top') },
  { value: 'center', label: t('np.center') },
] as const

function moduleSummary(module: CabinetModuleNodeType, t: TranslateFn) {
  if ((module.cabinetType ?? 'base') === 'tall') return t('np.tallCabinet')
  const stack = stackForCabinet(module)
  if (stack.length === 0) return t('np.empty')
  if (stack.length === 1) return stack[0]!.type
  return `${stack.length} ${t('np.compartments')}`
}

export function bumpRunLayoutRevisionViaStore(
  scene: ReturnType<typeof useScene.getState>,
  run: CabinetNodeType,
) {
  bumpCabinetRunLayoutRevision(createSceneApi(useScene), run)
  scene.markDirty(run.id as AnyNodeId)
}

function presetWidthDebt(
  module: CabinetModuleNodeType,
  sourceId: CabinetModuleNodeType['id'],
): number {
  const value = cabinetMetadataRecord(module.metadata)[PRESET_WIDTH_DEBT_KEY]
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 0
  const debt = (value as Record<string, unknown>)[sourceId]
  return typeof debt === 'number' && debt > 0 ? debt : 0
}

function metadataWithPresetWidthDebt(
  module: CabinetModuleNodeType,
  sourceId: CabinetModuleNodeType['id'],
  widthDelta: number,
): CabinetModuleNodeType['metadata'] {
  const metadata = cabinetMetadataRecord(module.metadata)
  const value = metadata[PRESET_WIDTH_DEBT_KEY]
  const debts =
    value && typeof value === 'object' && !Array.isArray(value)
      ? { ...(value as Record<string, unknown>) }
      : {}
  const nextDebt = Math.max(0, presetWidthDebt(module, sourceId) - widthDelta)
  if (nextDebt > 1e-4) debts[sourceId] = nextDebt
  else delete debts[sourceId]

  if (Object.keys(debts).length > 0) {
    return { ...metadata, [PRESET_WIDTH_DEBT_KEY]: debts } as CabinetModuleNodeType['metadata']
  }
  const { [PRESET_WIDTH_DEBT_KEY]: _removed, ...rest } = metadata
  return rest as CabinetModuleNodeType['metadata']
}

export function reflowRunModules({
  modules,
  parentRun,
  patch,
  preserveExtent = false,
  scene,
  selected,
}: {
  modules: CabinetModuleNodeType[]
  parentRun: CabinetNodeType
  patch: Partial<CabinetModuleNodeType>
  preserveExtent?: boolean
  scene: ReturnType<typeof useScene.getState>
  selected: CabinetModuleNodeType
}) {
  const reflowed = reflowCabinetRunModules(modules, selected.id, patch.width ?? selected.width, {
    preserveExtent,
    restorableWidthById: new Map(
      modules.map((module) => [module.id, presetWidthDebt(module, selected.id)]),
    ),
  })
  if (reflowed.length === 0) return

  const reflowById = new Map(reflowed.map((entry) => [entry.id, entry]))
  for (const module of [...modules].sort((a, b) => a.position[0] - b.position[0])) {
    const reflow = reflowById.get(module.id)
    if (!reflow) continue
    const isSelected = module.id === selected.id
    const nextPatch: Partial<CabinetModuleNodeType> = isSelected
      ? { ...patch, width: reflow.width }
      : { width: reflow.width }
    const widthDelta = reflow.width - module.width
    if (!isSelected && preserveExtent && Math.abs(widthDelta) > 1e-4) {
      nextPatch.metadata = metadataWithPresetWidthDebt(module, selected.id, widthDelta)
    }
    const nextPosition: CabinetModuleNodeType['position'] = [
      reflow.position[0],
      isSelected && patch.position ? patch.position[1] : reflow.position[1],
      isSelected && typeof patch.depth === 'number'
        ? backAnchoredModuleZ(module.position[2], module.depth, patch.depth)
        : reflow.position[2],
    ]

    if (isSelected) {
      const cabinetType = patch.cabinetType ?? module.cabinetType
      if (cabinetType === 'base') {
        nextPatch.depth = patch.depth ?? parentRun.depth
        nextPatch.carcassHeight = patch.carcassHeight ?? parentRun.carcassHeight
        nextPatch.plinthHeight = patch.plinthHeight ?? parentRun.plinthHeight
        nextPatch.toeKickDepth = patch.toeKickDepth ?? parentRun.toeKickDepth
        nextPatch.countertopThickness = patch.countertopThickness ?? 0
        nextPatch.countertopOverhang = patch.countertopOverhang ?? parentRun.countertopOverhang
      }
    }

    nextPatch.position = nextPosition
    scene.updateNode(module.id as AnyNodeId, nextPatch)

    const wallChild = wallChildOf(
      module,
      scene.nodes as Record<string, CabinetEditableNode | undefined>,
    )
    if (wallChild) {
      scene.updateNode(wallChild.id as AnyNodeId, {
        position: [
          0,
          wallChild.position[1],
          backAlignZ(nextPatch.depth ?? module.depth, wallChild.depth),
        ],
        width: reflow.width,
      })
      scene.markDirty(module.id as AnyNodeId)
    }
  }

  bumpRunLayoutRevisionViaStore(scene, parentRun)
}

export function CabinetRunPanel({
  node,
  modules,
  onClose,
}: {
  node: CabinetNodeType
  modules: CabinetModuleNodeType[]
  onClose: () => void
}) {
  const { t } = useI18n()
  const setSelection = useViewer((s) => s.setSelection)
  const sortedModules = useMemo(
    () => [...modules].sort((a, b) => a.position[0] - b.position[0]),
    [modules],
  )

  const updateRun = useCallback(
    (patch: Partial<CabinetNodeType>) => {
      const scene = useScene.getState()
      const sceneApi = createSceneApi(useScene)
      const nextPatch = { ...patch }
      if (typeof nextPatch.carcassHeight === 'number') {
        const minModuleHeight = Math.max(
          0.4,
          ...modules.map((module) => minCabinetCarcassHeightForStack(module)),
        )
        nextPatch.carcassHeight = Math.max(nextPatch.carcassHeight, minModuleHeight)
      }
      const nextNode = { ...node, ...nextPatch }
      scene.updateNode(node.id, nextPatch)

      const shouldSyncDepth = RUN_DEPTH_PATCH_KEY in nextPatch
      const shouldSyncHeight = 'carcassHeight' in nextPatch
      const shouldSyncPosition = Object.keys(nextPatch).some((key) =>
        RUN_POSITION_PATCH_KEYS.has(key as keyof CabinetNodeType),
      )
      const shouldSyncModules = Object.keys(nextPatch).some((key) =>
        RUN_MODULE_SYNC_PATCH_KEYS.has(key as keyof CabinetNodeType),
      )
      if (!shouldSyncDepth && !shouldSyncHeight && !shouldSyncPosition && !shouldSyncModules) return

      const stylePatch: Partial<CabinetNodeType> = {}
      if ('frontStyle' in nextPatch) stylePatch.frontStyle = nextNode.frontStyle
      if ('frontOverlay' in nextPatch) stylePatch.frontOverlay = nextNode.frontOverlay
      if ('handleStyle' in nextPatch) stylePatch.handleStyle = nextNode.handleStyle
      if ('handlePosition' in nextPatch) stylePatch.handlePosition = nextNode.handlePosition

      for (const module of modules) {
        const modulePatch: Partial<CabinetModuleNodeType> = {}
        if (shouldSyncDepth) {
          modulePatch.depth = nextNode.depth
        }
        if (shouldSyncHeight) {
          modulePatch.carcassHeight = Math.max(
            nextNode.carcassHeight,
            minCabinetCarcassHeightForStack(module),
          )
        }
        if (shouldSyncPosition) {
          modulePatch.position = [module.position[0], runModuleBaseY(nextNode), module.position[2]]
        }
        if (shouldSyncModules) {
          if ('frontStyle' in nextPatch) modulePatch.frontStyle = nextNode.frontStyle
          if ('frontOverlay' in nextPatch) modulePatch.frontOverlay = nextNode.frontOverlay
          if ('handleStyle' in nextPatch) modulePatch.handleStyle = nextNode.handleStyle
          if ('handlePosition' in nextPatch) modulePatch.handlePosition = nextNode.handlePosition
        }
        scene.updateNode(module.id, modulePatch)

        if (shouldSyncModules) {
          const wallChild = wallChildOf(
            module,
            scene.nodes as Record<string, CabinetEditableNode | undefined>,
          )
          if (wallChild) {
            scene.updateNode(wallChild.id, {
              frontStyle: nextNode.frontStyle,
              frontOverlay: nextNode.frontOverlay,
              handleStyle: nextNode.handleStyle,
              handlePosition: nextNode.handlePosition,
            })
          }
        }
      }

      const cornerSource = cornerLinkedSourceModuleForRun(nextNode, scene.nodes)
      if (shouldSyncModules) {
        syncCornerStyleGroupFromRun({
          run: nextNode,
          patch: stylePatch,
          sceneApi,
        })
      } else if (cornerSource) {
        syncCornerRunsFromSourceModule({
          module: cornerSource,
          run: nextNode,
          sceneApi,
        })
      }
    },
    [modules, node],
  )

  const addModule = useCallback(
    (side: 'left' | 'right') => {
      const id = addCabinetModuleSide({
        anchorModule: null,
        run: node,
        sceneApi: createSceneApi(useScene),
        side,
      })
      if (id) setSelection({ selectedIds: [id] })
    },
    [node, setSelection],
  )

  const deleteModule = useCallback(
    (module: CabinetModuleNodeType) => {
      useScene.getState().deleteNode(module.id as AnyNodeId)
      // Deleting the last module cascades the empty run away too — only
      // keep it selected/dirty if it survived.
      if (useScene.getState().nodes[node.id as AnyNodeId]) {
        useScene.getState().markDirty(node.id as AnyNodeId)
        setSelection({ selectedIds: [node.id] })
      } else {
        setSelection({ selectedIds: [] })
      }
    },
    [node.id, setSelection],
  )

  return (
    <PanelWrapper
      icon="/icons/item.webp"
      onClose={onClose}
      title={node.name || t('np.modularCabinet')}
      width={320}
    >
      <PanelSection title={t('np.modules')}>
        <div className="flex flex-col gap-2 px-1 pb-2">
          {sortedModules.map((module, index) => (
            <div
              className="flex items-center justify-between rounded-lg border border-border/40 bg-[#252527] px-2 py-2"
              key={module.id}
            >
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => setSelection({ selectedIds: [module.id] })}
                type="button"
              >
                <div className="truncate text-xs font-medium text-foreground">
                  {module.name || `${t('np.module')} ${index + 1}`}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {moduleSummary(module, t)}
                </div>
              </button>
              <button
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-red-500/20 bg-red-500/8 text-red-300 transition-colors hover:bg-red-500/15 hover:text-red-200 disabled:opacity-30"
                disabled={modules.length <= 1}
                onClick={() => deleteModule(module)}
                type="button"
              >
                <Trash className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="px-1 pb-1">
          <div className="grid grid-cols-2 gap-2">
            <ActionButton
              icon={<Plus className="h-4 w-4" />}
              label={t('np.addLeft')}
              onClick={() => addModule('left')}
            />
            <ActionButton
              icon={<Plus className="h-4 w-4" />}
              label={t('np.addRight')}
              onClick={() => addModule('right')}
            />
          </div>
        </div>
      </PanelSection>

      <PanelSection title={t('np.sharedPlinthCountertop')}>
        <div className="space-y-2 px-1 pb-2">
          <SliderControl
            label={t('np.depth')}
            max={1.2}
            min={0.3}
            onChange={(value) => updateRun({ depth: value })}
            precision={2}
            step={0.01}
            unit="m"
            value={node.depth}
          />
          <SliderControl
            label={t('np.carcassHeight')}
            max={node.runTier === 'tall' ? 2.4 : 1.4}
            min={Math.max(0.4, ...modules.map((module) => minCabinetCarcassHeightForStack(module)))}
            onChange={(value) => updateRun({ carcassHeight: value })}
            precision={2}
            step={0.01}
            unit="m"
            value={node.carcassHeight}
          />
          <ToggleControl
            checked={node.showPlinth}
            label={t('np.showPlinth')}
            onChange={(checked) => updateRun({ showPlinth: checked })}
          />
          {node.showPlinth && (
            <SliderControl
              label={t('np.plinthHeight')}
              max={0.3}
              min={0.02}
              onChange={(value) => updateRun({ plinthHeight: value })}
              precision={2}
              step={0.01}
              unit="m"
              value={node.plinthHeight}
            />
          )}
          <ToggleControl
            checked={node.withCountertop}
            label={t('np.showCountertop')}
            onChange={(checked) => updateRun({ withCountertop: checked })}
          />
          {node.withCountertop && (
            <>
              <SliderControl
                label={t('np.countertopHeight')}
                max={0.08}
                min={0.005}
                onChange={(value) => updateRun({ countertopThickness: value })}
                precision={3}
                step={0.005}
                unit="m"
                value={node.countertopThickness}
              />
              <SliderControl
                label={t('np.countertopDepth')}
                max={0.12}
                min={0}
                onChange={(value) => updateRun({ countertopOverhang: value })}
                precision={2}
                step={0.005}
                unit="m"
                value={node.countertopOverhang}
              />
            </>
          )}
        </div>
      </PanelSection>

      <PanelSection title={t('np.islandBar')}>
        <div className="space-y-2 px-1 pb-2">
          {node.withCountertop && node.barLedge?.edge !== 'back' && (
            <SliderControl
              label={t('np.seatingOverhang')}
              max={0.45}
              min={0}
              onChange={(value) => updateRun({ countertopBackOverhang: value })}
              precision={2}
              step={0.05}
              unit="m"
              value={node.countertopBackOverhang}
            />
          )}
          <ToggleControl
            checked={node.withFinishedBack}
            label={t('np.finishedBack')}
            onChange={(checked) => updateRun({ withFinishedBack: checked })}
          />
          {node.withCountertop && (
            <ToggleControl
              checked={node.withWaterfall}
              label={t('np.waterfallEnds')}
              onChange={(checked) => updateRun({ withWaterfall: checked })}
            />
          )}
          <ToggleControl
            checked={Boolean(node.barLedge)}
            label={t('np.barCounter')}
            onChange={(checked) =>
              updateRun({
                barLedge: checked ? { edge: 'back', height: 1.06, depth: 0.35 } : undefined,
              })
            }
          />
          {node.barLedge && (
            <>
              <SegmentedControl
                onChange={(value) =>
                  updateRun({
                    barLedge: { ...node.barLedge!, edge: value as 'back' | 'left' | 'right' },
                  })
                }
                options={[
                  { value: 'back', label: t('np.back') },
                  { value: 'left', label: t('np.left') },
                  { value: 'right', label: t('np.right') },
                ]}
                value={node.barLedge.edge}
              />
              <SliderControl
                label={t('np.barHeight2')}
                max={1.3}
                min={0.9}
                onChange={(value) => updateRun({ barLedge: { ...node.barLedge!, height: value } })}
                precision={2}
                step={0.01}
                unit="m"
                value={node.barLedge.height}
              />
              <SliderControl
                label={t('np.barDepth')}
                max={0.5}
                min={0.15}
                onChange={(value) => updateRun({ barLedge: { ...node.barLedge!, depth: value } })}
                precision={2}
                step={0.01}
                unit="m"
                value={node.barLedge.depth}
              />
            </>
          )}
        </div>
      </PanelSection>

      <PanelSection title={t('np.fronts')}>
        <div className="space-y-2 px-1 pb-2">
          <div>
            <div className="px-1 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              {t('np.style')}
            </div>
            <SegmentedControl
              onChange={(value) =>
                updateRun({ frontStyle: value as CabinetNodeType['frontStyle'] })
              }
              options={FRONT_STYLE_OPTIONS(t).map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              value={node.frontStyle ?? 'slab'}
            />
          </div>
          <div>
            <div className="px-1 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              {t('np.mounting')}
            </div>
            <SegmentedControl
              onChange={(value) =>
                updateRun({ frontOverlay: value as CabinetNodeType['frontOverlay'] })
              }
              options={FRONT_OVERLAY_OPTIONS(t).map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              value={node.frontOverlay ?? 'full'}
            />
          </div>
        </div>
      </PanelSection>

      <PanelSection title={t('np.handles')}>
        <div className="space-y-2 px-1 pb-2">
          <div>
            <div className="px-1 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              {t('np.style')}
            </div>
            <SegmentedControl
              onChange={(value) =>
                updateRun({ handleStyle: value as CabinetNodeType['handleStyle'] })
              }
              options={HANDLE_STYLE_OPTIONS(t).map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              value={node.handleStyle}
            />
          </div>
          {(node.handleStyle === 'bar' || node.handleStyle === 'knob') && (
            <div>
              <div className="px-1 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                {t('np.position')}
              </div>
              <SegmentedControl
                onChange={(value) =>
                  updateRun({ handlePosition: value as CabinetNodeType['handlePosition'] })
                }
                options={HANDLE_POSITION_OPTIONS(t).map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                value={node.handlePosition ?? 'auto'}
              />
            </div>
          )}
        </div>
      </PanelSection>
    </PanelWrapper>
  )
}
