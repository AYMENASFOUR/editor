'use client'

import {
  type AnyNode,
  type AnyNodeId,
  createDefaultRidgeVentsForSegment,
  isAutoRidgeVentEnabled,
  isDefaultRidgeVentNode,
  ROOF_SHAPE_DEFAULTS,
  type RoofSegmentNode,
  RoofSegmentNode as RoofSegmentNodeSchema,
  type RoofType,
  useScene,
} from '@pascal-app/core'
import {
  ActionButton,
  ActionGroup,
  PanelSection,
  PanelWrapper,
  SegmentedControl,
  SliderControl,
  ToggleControl,
  triggerSFX,
  useEditor, useI18n, type TranslateFn} from '@pascal-app/editor'
import { useViewer } from '@pascal-app/viewer'
import { Copy, Move, Trash2 } from 'lucide-react'
import { useCallback } from 'react'

const ROOF_TYPE_OPTIONS = (t: TranslateFn): { label: string; value: RoofType }[] => [
  { label: t('np.hip'), value: 'hip' },
  { label: t('np.gable'), value: 'gable' },
  { label: t('np.shed'), value: 'shed' },
]

const ROOF_TYPE_OPTIONS_2 = (t: TranslateFn): { label: string; value: RoofType }[] => [
  { label: t('np.flat'), value: 'flat' },
  { label: t('np.gambrel'), value: 'gambrel' },
  { label: t('np.dutch'), value: 'dutch' },
  { label: t('np.mansard'), value: 'mansard' },
]

// Carpenter / roofer convention: rise over a 12" run, converted to degrees.
// atan(3/12) ≈ 14.04°, atan(6/12) ≈ 26.57°, atan(9/12) ≈ 36.87°, atan(12/12) = 45°.
const PITCH_PRESETS = (t: TranslateFn): { label: string; deg: number }[] => [
  { label: t('np.n312'), deg: 14.04 },
  { label: t('np.n612'), deg: 26.57 },
  { label: t('np.n912'), deg: 36.87 },
  { label: t('np.n1212'), deg: 45 },
]

function shouldShowTrimPlanes(metadata: unknown): boolean {
  return metadataRecord(metadata).showTrimPlanes === true
}

function metadataRecord(metadata: unknown): Record<string, unknown> {
  if (typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>
  }
  return {}
}

export default function RoofSegmentPanel() {
  const { t } = useI18n()
  const selectedId = useViewer((s) => s.selection.selectedIds[0])
  const setSelection = useViewer((s) => s.setSelection)
  const updateNode = useScene((s) => s.updateNode)
  const setMovingNode = useEditor((s) => s.setMovingNode)
  const setRoofHostDragArmedId = useEditor((s) => s.setRoofHostDragArmedId)

  const node = useScene((s) =>
    selectedId ? (s.nodes[selectedId as AnyNode['id']] as RoofSegmentNode | undefined) : undefined,
  )
  const autoRidgeVentEnabled = useScene((s) => {
    const current = selectedId
      ? (s.nodes[selectedId as AnyNode['id']] as RoofSegmentNode | undefined)
      : undefined
    if (current?.type !== 'roof-segment') return false
    return isAutoRidgeVentEnabled(current, s.nodes)
  })

  const handleUpdate = useCallback(
    (updates: Partial<RoofSegmentNode>) => {
      if (!selectedId) return
      updateNode(selectedId as AnyNode['id'], updates)
    },
    [selectedId, updateNode],
  )

  const handleRoofTypeChange = useCallback(
    (roofType: RoofType) => {
      // Switching to Dutch resets the shape parameters to their defaults so the
      // gablet is well-formed regardless of the leftover values from the
      // previous roof type.
      handleUpdate(
        roofType === 'dutch'
          ? {
              roofType,
              dutchHipWidthRatio: ROOF_SHAPE_DEFAULTS.dutchHipWidthRatio,
              dutchHipHeightRatio: ROOF_SHAPE_DEFAULTS.dutchHipHeightRatio,
              dutchWaistLengthRatio: ROOF_SHAPE_DEFAULTS.dutchWaistLengthRatio,
              dutchGabletRake: ROOF_SHAPE_DEFAULTS.dutchGabletRake,
              dutchTopRakeThickness: ROOF_SHAPE_DEFAULTS.dutchTopRakeThickness,
            }
          : { roofType },
      )
    },
    [handleUpdate],
  )

  const handleClose = useCallback(() => {
    setSelection({ selectedIds: [] })
  }, [setSelection])

  const handleBack = useCallback(() => {
    if (node?.parentId) {
      setRoofHostDragArmedId(node.parentId as AnyNodeId)
      setSelection({ selectedIds: [node.parentId] })
    }
  }, [node?.parentId, setRoofHostDragArmedId, setSelection])

  const handleDuplicate = useCallback(() => {
    if (!node?.parentId) return
    triggerSFX('sfx:item-pick')

    let duplicateInfo = structuredClone(node) as any
    delete duplicateInfo.id
    duplicateInfo.metadata = { ...duplicateInfo.metadata, isNew: true }
    // Offset slightly so it's visible
    duplicateInfo.position = [
      duplicateInfo.position[0] + 1,
      duplicateInfo.position[1],
      duplicateInfo.position[2] + 1,
    ]

    try {
      const duplicate = RoofSegmentNodeSchema.parse(duplicateInfo)
      useScene.getState().createNode(duplicate, duplicate.parentId as AnyNodeId)
      setSelection({ selectedIds: [] })
      setMovingNode(duplicate)
    } catch (e) {
      console.error('Failed to duplicate roof segment', e)
    }
  }, [node, setSelection, setMovingNode])

  const handleMove = useCallback(() => {
    if (node) {
      triggerSFX('sfx:item-pick')
      setMovingNode(node)
      setSelection({ selectedIds: [] })
    }
  }, [node, setMovingNode, setSelection])

  const handleDelete = useCallback(() => {
    if (!(selectedId && node)) return
    triggerSFX('sfx:item-delete')
    const parentId = node.parentId
    useScene.getState().deleteNode(selectedId as AnyNodeId)
    if (parentId) {
      useScene.getState().dirtyNodes.add(parentId as AnyNodeId)
      setSelection({ selectedIds: [parentId] })
    } else {
      setSelection({ selectedIds: [] })
    }
  }, [selectedId, node, setSelection])

  const handleAutoRidgeVentToggle = useCallback(
    (checked: boolean) => {
      if (!selectedId) return
      const scene = useScene.getState()
      const current = scene.nodes[selectedId as AnyNodeId] as RoofSegmentNode | undefined
      if (current?.type !== 'roof-segment') return

      scene.updateNode(selectedId as AnyNodeId, {
        metadata: { ...metadataRecord(current.metadata), autoRidgeVent: checked },
      })

      const latest = useScene.getState().nodes[selectedId as AnyNodeId] as
        | RoofSegmentNode
        | undefined
      if (latest?.type !== 'roof-segment') return

      const defaultVentIds = (latest.children ?? []).filter((childId) =>
        isDefaultRidgeVentNode(useScene.getState().nodes[childId as AnyNodeId], latest.id),
      ) as AnyNodeId[]

      if (!checked) {
        if (defaultVentIds.length > 0) {
          useScene.getState().deleteNodes(defaultVentIds)
        }
        return
      }

      if (defaultVentIds.length > 0) return

      const ridgeVents = createDefaultRidgeVentsForSegment(latest)
      if (ridgeVents.length === 0) return

      scene.createNodes(
        ridgeVents.map((ridgeVent) => ({
          node: ridgeVent,
          parentId: latest.id as AnyNodeId,
        })),
      )
    },
    [selectedId],
  )

  if (!(node && node.type === 'roof-segment' && selectedId)) return null

  const showTrimPlanes = shouldShowTrimPlanes(node.metadata)

  return (
    <PanelWrapper
      icon="/icons/roof.webp"
      onBack={handleBack}
      onClose={handleClose}
      title={node.name || t('np.roofSegment')}
      width={300}
    >
      <PanelSection title={t('np.roofType')}>
        <SegmentedControl
          onChange={(v) => handleRoofTypeChange(v)}
          options={ROOF_TYPE_OPTIONS(t)}
          value={node.roofType}
        />
        <SegmentedControl
          onChange={(v) => handleRoofTypeChange(v)}
          options={ROOF_TYPE_OPTIONS_2(t)}
          value={node.roofType}
        />
      </PanelSection>

      <PanelSection title={t('np.trim')}>
        <ToggleControl
          checked={showTrimPlanes}
          label={t('np.showTrimPlanes')}
          onChange={(checked) =>
            handleUpdate({
              metadata: { ...metadataRecord(node.metadata), showTrimPlanes: checked },
            })
          }
        />
        {node.roofType !== 'shed' && node.roofType !== 'flat' && (
          <ToggleControl
            checked={autoRidgeVentEnabled}
            label={t('np.autoRidgeVent')}
            onChange={handleAutoRidgeVentToggle}
          />
        )}
      </PanelSection>

      <PanelSection title={t('np.footprint')}>
        <SliderControl
          label={t('np.width')}
          max={25}
          min={0.5}
          onChange={(v) => handleUpdate({ width: v })}
          precision={2}
          step={0.5}
          unit="m"
          value={Math.round(node.width * 100) / 100}
        />
        <SliderControl
          label={t('np.depth')}
          max={25}
          min={0.5}
          onChange={(v) => handleUpdate({ depth: v })}
          precision={2}
          step={0.5}
          unit="m"
          value={Math.round(node.depth * 100) / 100}
        />
      </PanelSection>

      <PanelSection title={t('np.wallHeight')}>
        <SliderControl
          label={t('np.wall')}
          max={5}
          min={0}
          onChange={(v) => handleUpdate({ wallHeight: v })}
          precision={2}
          step={0.1}
          unit="m"
          value={Math.round(node.wallHeight * 100) / 100}
        />
      </PanelSection>

      <PanelSection title={t('np.pitch')}>
        <SliderControl
          label={t('np.angle')}
          max={60}
          min={0}
          onChange={(v) => handleUpdate({ pitch: v })}
          precision={0}
          step={1}
          unit="°"
          value={Math.round(node.pitch)}
        />
        <div className="flex gap-1.5 px-1 pt-2 pb-1">
          {PITCH_PRESETS(t).map((preset) => (
            <ActionButton
              key={preset.label}
              label={preset.label}
              onClick={() => handleUpdate({ pitch: preset.deg })}
            />
          ))}
        </div>
      </PanelSection>

      {node.roofType === 'gambrel' && (
        <PanelSection title={t('np.shape')}>
          <SliderControl
            label={t('np.kinkDepth')}
            max={0.9}
            min={0.1}
            onChange={(v) => handleUpdate({ gambrelLowerWidthRatio: v })}
            precision={2}
            step={0.01}
            unit=""
            value={Math.round(node.gambrelLowerWidthRatio * 100) / 100}
          />
          <SliderControl
            label={t('np.kinkHeight')}
            max={0.9}
            min={0.1}
            onChange={(v) => handleUpdate({ gambrelLowerHeightRatio: v })}
            precision={2}
            step={0.01}
            unit=""
            value={Math.round(node.gambrelLowerHeightRatio * 100) / 100}
          />
        </PanelSection>
      )}

      {node.roofType === 'mansard' && (
        <PanelSection title={t('np.shape')}>
          <SliderControl
            label={t('np.waistWidth')}
            max={0.45}
            min={0.05}
            onChange={(v) => handleUpdate({ mansardSteepWidthRatio: v })}
            precision={2}
            step={0.01}
            unit=""
            value={Math.round(node.mansardSteepWidthRatio * 100) / 100}
          />
          <SliderControl
            label={t('np.waistHeight')}
            max={0.9}
            min={0.1}
            onChange={(v) => handleUpdate({ mansardSteepHeightRatio: v })}
            precision={2}
            step={0.01}
            unit=""
            value={Math.round(node.mansardSteepHeightRatio * 100) / 100}
          />
        </PanelSection>
      )}

      {node.roofType === 'dutch' && (
        <PanelSection title={t('np.shape')}>
          <SliderControl
            label={t('np.waistWidth')}
            max={0.45}
            min={0.05}
            onChange={(v) => handleUpdate({ dutchHipWidthRatio: v })}
            precision={2}
            step={0.01}
            unit=""
            value={Math.round(node.dutchHipWidthRatio * 100) / 100}
          />
          <SliderControl
            label={t('np.waistHeight')}
            max={0.9}
            min={0.1}
            onChange={(v) => handleUpdate({ dutchHipHeightRatio: v })}
            precision={2}
            step={0.01}
            unit=""
            value={Math.round(node.dutchHipHeightRatio * 100) / 100}
          />
          <SliderControl
            label={t('np.waistLength')}
            max={1}
            min={0.1}
            onChange={(v) => handleUpdate({ dutchWaistLengthRatio: v })}
            precision={2}
            step={0.01}
            unit=""
            value={
              Math.round(
                (node.dutchWaistLengthRatio ?? ROOF_SHAPE_DEFAULTS.dutchWaistLengthRatio) * 100,
              ) / 100
            }
          />
          <SliderControl
            label={t('np.topRakeThick')}
            max={0.5}
            min={0.01}
            onChange={(v) => handleUpdate({ dutchTopRakeThickness: v })}
            precision={2}
            step={0.01}
            unit="m"
            value={
              Math.round(
                (node.dutchTopRakeThickness ?? ROOF_SHAPE_DEFAULTS.dutchTopRakeThickness) * 100,
              ) / 100
            }
          />
          <SliderControl
            label={t('np.topRakeLength')}
            max={3}
            min={0}
            onChange={(v) => handleUpdate({ dutchGabletRake: v })}
            precision={2}
            step={0.01}
            unit="m"
            value={
              Math.round((node.dutchGabletRake ?? ROOF_SHAPE_DEFAULTS.dutchGabletRake) * 100) / 100
            }
          />
        </PanelSection>
      )}

      <PanelSection title={t('np.structure')}>
        <SliderControl
          label={t('np.wallThick')}
          max={1}
          min={0.05}
          onChange={(v) => handleUpdate({ wallThickness: v })}
          precision={2}
          step={0.05}
          unit="m"
          value={Math.round(node.wallThickness * 100) / 100}
        />
        <SliderControl
          label={t('np.deckThick')}
          max={0.3}
          min={0.04}
          onChange={(v) => handleUpdate({ deckThickness: v })}
          precision={2}
          step={0.01}
          unit="m"
          value={Math.round(node.deckThickness * 100) / 100}
        />
        <SliderControl
          label={t('np.overhang')}
          max={1}
          min={0}
          onChange={(v) => handleUpdate({ overhang: v })}
          precision={2}
          step={0.05}
          unit="m"
          value={Math.round(node.overhang * 100) / 100}
        />
        <SliderControl
          label={t('np.shingleThick')}
          max={0.3}
          min={0.02}
          onChange={(v) => handleUpdate({ shingleThickness: v })}
          precision={2}
          step={0.01}
          unit="m"
          value={Math.round(node.shingleThickness * 100) / 100}
        />
      </PanelSection>

      <PanelSection title={t('np.position')}>
        <SliderControl
          label={t('np.x')}
          max={50}
          min={-50}
          onChange={(v) => {
            const pos = [...node.position] as [number, number, number]
            pos[0] = v
            handleUpdate({ position: pos })
          }}
          precision={2}
          step={0.05}
          unit="m"
          value={Math.round(node.position[0] * 100) / 100}
        />
        <SliderControl
          label={t('np.y')}
          max={50}
          min={-50}
          onChange={(v) => {
            const pos = [...node.position] as [number, number, number]
            pos[1] = v
            handleUpdate({ position: pos })
          }}
          precision={2}
          step={0.05}
          unit="m"
          value={Math.round(node.position[1] * 100) / 100}
        />
        <SliderControl
          label={t('np.z')}
          max={50}
          min={-50}
          onChange={(v) => {
            const pos = [...node.position] as [number, number, number]
            pos[2] = v
            handleUpdate({ position: pos })
          }}
          precision={2}
          step={0.05}
          unit="m"
          value={Math.round(node.position[2] * 100) / 100}
        />
        <SliderControl
          label={t('np.rotation')}
          max={180}
          min={-180}
          onChange={(degrees) => {
            handleUpdate({ rotation: (degrees * Math.PI) / 180 })
          }}
          precision={0}
          step={1}
          unit="°"
          value={Math.round((node.rotation * 180) / Math.PI)}
        />
        <div className="flex gap-1.5 px-1 pt-2 pb-1">
          <ActionButton
            label={t('np.n452')}
            onClick={() => {
              triggerSFX('sfx:item-rotate')
              handleUpdate({ rotation: node.rotation - Math.PI / 4 })
            }}
          />
          <ActionButton
            label={t('np.n45')}
            onClick={() => {
              triggerSFX('sfx:item-rotate')
              handleUpdate({ rotation: node.rotation + Math.PI / 4 })
            }}
          />
        </div>
      </PanelSection>

      <PanelSection title={t('np.actions')}>
        <ActionGroup>
          <ActionButton icon={<Move className="h-3.5 w-3.5" />} label={t('np.move')} onClick={handleMove} />
          <ActionButton
            icon={<Copy className="h-3.5 w-3.5" />}
            label={t('np.duplicate')}
            onClick={handleDuplicate}
          />
          <ActionButton
            className="hover:bg-red-500/20"
            icon={<Trash2 className="h-3.5 w-3.5 text-red-400" />}
            label={t('np.delete')}
            onClick={handleDelete}
          />
        </ActionGroup>
      </PanelSection>
    </PanelWrapper>
  )
}
