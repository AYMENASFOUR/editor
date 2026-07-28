'use client'

import {
  type AnyNode,
  type AnyNodeId,
  type ConstructionDimensionDatumPolicy,
  type ConstructionDimensionDrawingPresentation,
  type ConstructionDimensionImperialPrecision,
  type ConstructionDimensionMetricNotation,
  type ConstructionDimensionNode,
  type ConstructionDimensionTerminator,
  type ConstructionDimensionTextPosition,
  type ConstructionDrawingType,
  resolveConstructionDimensionDrawingOverride,
  resolveConstructionDimensionDrawingPresentation,
  setConstructionDimensionDrawingPresentation,
  setConstructionDimensionDrawingSuppressedSegments,
  useScene,
} from '@pascal-app/core'
import {
  ActionButton,
  ActionGroup,
  DRAWING_TYPE_OPTIONS,
  PanelSection,
  PanelWrapper,
  SliderControl,
  triggerSFX,
  useDrawingView, useI18n, type TranslateFn} from '@pascal-app/editor'
import { useViewer } from '@pascal-app/viewer'
import { Trash2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

const MODE_LABELS = (t: TranslateFn): Record<ConstructionDimensionNode['mode'], string> => ({
  linear: t('np.linear'),
  radius: t('np.radius'),
  diameter: t('np.diameter'),
  'center-mark': t('np.centerMark'),
  chord: t('np.chord'),
  'arc-length': t('np.arcLength'),
  angular: t('np.angular'),
  coordinate: t('np.coordinate'),
})

const DATUM_POLICY_OPTIONS = (t: TranslateFn): Array<{ label: string; value: ConstructionDimensionDatumPolicy }> => [
  { label: t('np.centerline'), value: 'centerline' },
  { label: t('np.wallFace'), value: 'wall-face' },
  { label: t('np.structuralFace'), value: 'structural-face' },
  { label: t('np.finishFace'), value: 'finish-face' },
]

const TERMINATOR_OPTIONS = (t: TranslateFn): Array<{ label: string; value: ConstructionDimensionTerminator }> => [
  { label: t('np.architecturalTick'), value: 'architectural-tick' },
  { label: t('np.filledArrow'), value: 'filled-arrow' },
  { label: t('np.openArrow'), value: 'open-arrow' },
  { label: t('np.dot'), value: 'dot' },
]

const TEXT_POSITION_OPTIONS = (t: TranslateFn): Array<{ label: string; value: ConstructionDimensionTextPosition }> => [
  { label: t('np.aboveLine'), value: 'above' },
  { label: t('np.centeredOnLine'), value: 'centered' },
]

const IMPERIAL_PRECISION_OPTIONS = (t: TranslateFn): Array<{
  label: string
  value: ConstructionDimensionImperialPrecision
}> => [
  { label: t('np.nearestInch'), value: '1' },
  { label: t('np.nearest12Inch'), value: '1/2' },
  { label: t('np.nearest14Inch'), value: '1/4' },
  { label: t('np.nearest18Inch'), value: '1/8' },
  { label: t('np.nearest116Inch'), value: '1/16' },
]

const METRIC_NOTATION_OPTIONS = (t: TranslateFn): Array<{
  label: string
  value: ConstructionDimensionMetricNotation
}> => [
  { label: t('np.meters'), value: 'meters' },
  { label: t('np.millimeters'), value: 'millimeters' },
]

export default function ConstructionDimensionPanel() {
  const { t } = useI18n()
  const selectedId = useViewer((state) => state.selection.selectedIds[0])
  const setSelection = useViewer((state) => state.setSelection)
  const dimension = useScene((state) => {
    const node = selectedId ? state.nodes[selectedId as AnyNodeId] : undefined
    return node?.type === 'construction-dimension' ? node : null
  })
  const updateNode = useScene((state) => state.updateNode)
  const deleteNode = useScene((state) => state.deleteNode)
  const activeDrawingType = useDrawingView((state) => state.drawingType)

  if (!(dimension && selectedId)) return null
  const update = (patch: Partial<ConstructionDimensionNode>) => updateNode(dimension.id, patch)
  const supportsCenterMark = ['radius', 'diameter', 'arc-length', 'angular'].includes(
    dimension.mode,
  )
  const activeDrawingLabel =
    DRAWING_TYPE_OPTIONS.find((option) => option.id === activeDrawingType)?.label ?? t('np.floorPlan')
  const activePresentation = resolveConstructionDimensionDrawingPresentation(
    dimension,
    activeDrawingType,
  )
  const activeDrawingOverride = resolveConstructionDimensionDrawingOverride(
    dimension,
    activeDrawingType,
  )
  const suppressedSegmentsText = formatSuppressedSegments(
    activeDrawingOverride?.suppressedSegmentIndexes ?? [],
  )
  const updateDrawingPresentation = (
    drawingType: ConstructionDrawingType,
    presentation: ConstructionDimensionDrawingPresentation,
  ) => {
    const drawingOverrides = setConstructionDimensionDrawingPresentation(
      dimension,
      drawingType,
      presentation,
    )
    const firstFoundationController =
      presentation === 'controlled' && !dimension.controllingDimensionId
        ? selectFoundationControllers(useScene.getState().nodes, dimension.id)[0]
        : undefined
    update({
      drawingOverrides,
      ...(presentation === 'controlled' && !dimension.controllingDimensionId
        ? { controllingDimensionId: firstFoundationController?.id ?? null }
        : {}),
    })
  }
  const updateSuppressedSegments = (value: string) => {
    update({
      drawingOverrides: setConstructionDimensionDrawingSuppressedSegments(
        dimension,
        activeDrawingType,
        parseSuppressedSegments(value),
      ),
    })
  }

  return (
    <PanelWrapper
      icon="/icons/blueprint.webp"
      onClose={() => setSelection({ selectedIds: [] })}
      title={t('np.constructionDimension')}
      width={320}
    >
      <PanelSection title={t('np.dimension')}>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">{t('np.mode')}</span>
          <span className="font-medium text-foreground">{MODE_LABELS(t)[dimension.mode]}</span>
        </div>
        <SliderControl
          label={t('np.featureCount')}
          max={999}
          min={1}
          onChange={(featureCount) => update({ featureCount })}
          precision={0}
          step={1}
          value={dimension.featureCount}
        />
        {supportsCenterMark ? (
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{t('np.centerMark')}</span>
            <input
              checked={dimension.showCenterMark}
              onChange={(event) => update({ showCenterMark: event.target.checked })}
              type="checkbox"
            />
          </label>
        ) : null}
      </PanelSection>

      <PanelSection title={t('np.drawingCoordination')}>
        <SelectField
          label={t('np.primaryDrawing')}
          onChange={(drawingType) =>
            update({ drawingType: drawingType as ConstructionDrawingType })
          }
          options={DRAWING_TYPE_OPTIONS.map((option) => ({
            label: option.label,
            value: option.id,
          }))}
          value={dimension.drawingType}
        />
        <SelectField
          label={`${activeDrawingLabel} ${t('np.presentation')}`}
          onChange={(presentation) =>
            updateDrawingPresentation(
              activeDrawingType,
              presentation as ConstructionDimensionDrawingPresentation,
            )
          }
          options={[
            { label: t('np.shown'), value: 'shown' },
            { label: t('np.omitted'), value: 'omit' },
            ...(activeDrawingType === 'floor-plan'
              ? [{ label: t('np.controlledByFoundation'), value: 'controlled' }]
              : []),
          ]}
          value={activePresentation}
        />
        {activeDrawingType === 'floor-plan' && activePresentation === 'controlled' ? (
          <FoundationControllerField
            dimensionId={dimension.id}
            onChange={(controllingDimensionId) =>
              update({
                controllingDimensionId,
              })
            }
            value={dimension.controllingDimensionId ?? ''}
          />
        ) : null}
        <p className="text-muted-foreground text-xs">
          {t('np.linkedDimensionsReuseTheControllerSAssoc')}
        </p>
        <TextField
          label={`${activeDrawingLabel} ${t('np.suppressedSegments')}`}
          onCommit={updateSuppressedSegments}
          placeholder={t('np.eG24')}
          value={suppressedSegmentsText}
        />
        <p className="text-muted-foreground text-xs">
          {t('np.segmentNumbersAreOneBasedAndApplyOnlyInT')}
        </p>
      </PanelSection>

      <PanelSection title={t('np.notation')}>
        <TextField
          label={t('np.prefix')}
          onCommit={(prefix) => update({ prefix })}
          value={dimension.prefix}
        />
        <TextField
          label={t('np.suffix')}
          onCommit={(suffix) => update({ suffix })}
          value={dimension.suffix}
        />
        <TextField
          label={t('np.textOverride')}
          onCommit={(textOverride) => update({ textOverride: textOverride || null })}
          placeholder={t('np.useMeasuredValue')}
          value={dimension.textOverride ?? ''}
        />
      </PanelSection>

      <PanelSection title={t('np.standards')}>
        <SelectField
          label={t('np.datumPolicy')}
          onChange={(datumPolicy) =>
            update({ datumPolicy: datumPolicy as ConstructionDimensionDatumPolicy })
          }
          options={DATUM_POLICY_OPTIONS(t)}
          value={dimension.datumPolicy}
        />
        <SelectField
          label={t('np.terminator')}
          onChange={(terminator) =>
            update({ terminator: terminator as ConstructionDimensionTerminator })
          }
          options={TERMINATOR_OPTIONS(t)}
          value={dimension.terminator}
        />
        <SelectField
          label={t('np.textPosition')}
          onChange={(textPosition) =>
            update({ textPosition: textPosition as ConstructionDimensionTextPosition })
          }
          options={TEXT_POSITION_OPTIONS(t)}
          value={dimension.textPosition}
        />
        <SelectField
          label={t('np.imperialPrecision')}
          onChange={(imperialPrecision) =>
            update({
              imperialPrecision: imperialPrecision as ConstructionDimensionImperialPrecision,
            })
          }
          options={IMPERIAL_PRECISION_OPTIONS(t)}
          value={dimension.imperialPrecision}
        />
        <SelectField
          label={t('np.metricNotation')}
          onChange={(metricNotation) =>
            update({ metricNotation: metricNotation as ConstructionDimensionMetricNotation })
          }
          options={METRIC_NOTATION_OPTIONS(t)}
          value={dimension.metricNotation}
        />
        <SliderControl
          label={t('np.extensionGap')}
          max={0.5}
          min={0}
          onChange={(extensionStartGap) => update({ extensionStartGap })}
          precision={3}
          step={0.005}
          value={dimension.extensionStartGap}
        />
        <SliderControl
          label={t('np.extensionOvershoot')}
          max={0.5}
          min={0}
          onChange={(extensionOvershoot) => update({ extensionOvershoot })}
          precision={3}
          step={0.005}
          value={dimension.extensionOvershoot}
        />
      </PanelSection>

      <PanelSection title={t('np.actions')}>
        <ActionGroup>
          <ActionButton
            className="border-red-500/40 text-red-200 hover:bg-red-500/15"
            icon={<Trash2 className="h-4 w-4" />}
            label={t('np.delete')}
            onClick={() => {
              triggerSFX('sfx:structure-delete')
              deleteNode(dimension.id)
              setSelection({ selectedIds: [] })
            }}
          />
        </ActionGroup>
      </PanelSection>
    </PanelWrapper>
  )
}

function selectFoundationControllers(
  nodes: Record<string, AnyNode>,
  excludedId: AnyNodeId,
): ConstructionDimensionNode[] {
  return Object.values(nodes).filter(
    (candidate): candidate is ConstructionDimensionNode =>
      candidate.type === 'construction-dimension' &&
      candidate.id !== excludedId &&
      candidate.drawingType === 'foundation-plan',
  )
}

function FoundationControllerField({
  dimensionId,
  value,
  onChange,
}: {
  dimensionId: AnyNodeId
  value: string
  onChange: (value: NonNullable<ConstructionDimensionNode['controllingDimensionId']>) => void
}) {
  const { t } = useI18n()
  const foundationControllers = useScene(
    useShallow((state) => selectFoundationControllers(state.nodes, dimensionId)),
  )
  return (
    <SelectField
      disabled={foundationControllers.length === 0}
      label={t('np.foundationController')}
      onChange={(controllingDimensionId) =>
        onChange(
          controllingDimensionId as NonNullable<
            ConstructionDimensionNode['controllingDimensionId']
          >,
        )
      }
      options={foundationControllers.map((controller) => ({
        label: controller.name || t('np.foundationDimension'),
        value: controller.id,
      }))}
      placeholder={t('np.noFoundationDimensions')}
      value={value}
    />
  )
}

function parseSuppressedSegments(value: string): number[] {
  return [
    ...new Set(
      value
        .split(/[,\s]+/)
        .map((part) => Number.parseInt(part, 10))
        .filter((index) => Number.isInteger(index) && index > 0)
        .map((index) => index - 1),
    ),
  ].sort((left, right) => left - right)
}

function formatSuppressedSegments(indexes: readonly number[]): string {
  return indexes.map((index) => index + 1).join(', ')
}

function SelectField({
  label,
  value,
  options,
  placeholder,
  disabled,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ label: string; value: string }>
  placeholder?: string
  disabled?: boolean
  onChange: (value: string) => void
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select
        className="w-full rounded-md border border-border/70 bg-background px-2 py-1.5 text-foreground disabled:opacity-50"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {placeholder && options.length === 0 ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function TextField({
  label,
  value,
  placeholder,
  onCommit,
}: {
  label: string
  value: string
  placeholder?: string
  onCommit: (value: string) => void
}) {
  const { t } = useI18n()
  return (
    <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        className="w-full rounded-md border border-border/70 bg-background px-2 py-1.5 text-foreground"
        defaultValue={value}
        key={value}
        onBlur={(event) => onCommit(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}
