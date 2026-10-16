import { describe, expect, test } from 'bun:test'
import {
  getRunSpans,
  moduleMaxX,
  moduleMinX,
  planToRunLocal,
  runLocalToPlan,
  runLocalXExtent,
} from '../run-layout'
import { CabinetModuleNode, CabinetNode } from '../schema'

/**
 * TASK-001: exact synthetic millimetre scenarios also declared in Matbakh Studio
 * tests/fixtures/task-001-scenarios.ts on audit/task-001-platform-selection.
 *
 * Purpose: exercise Editor's REAL cabinet schema + run-layout maths on the SAME
 * widths, wall vectors and offsets. Editor uses metres, Matbakh uses millimetres.
 * Scope LIMIT: numerical runs and plan transforms, NOT UI/E2E, corner-solver,
 * 3D renderer, manufacturing or factory-approved dimensions.
 */
type Wall = {
  id: string
  startMm: readonly [number, number]
  endMm: readonly [number, number]
  thicknessMm: number
}
type Unit = { id: string; offsetMm: number; widthMm: number }
type Run = {
  id: string
  wallId: string
  startMm: number
  endMm: number
  units: readonly Unit[]
  expectedLengthMm: number
  expectedOccupiedMm: number
  expectedRemainingMm: number
}
type Scenario = { id: string; walls: readonly Wall[]; runs: readonly Run[] }

const FIXTURES: readonly Scenario[] = [
  {
    id: 'straight',
    walls: [{ id: 'S-W1', startMm: [0, 0], endMm: [3600, 0], thicknessMm: 150 }],
    runs: [{
      id: 'S-R1', wallId: 'S-W1', startMm: 150, endMm: 3300,
      units: [
        { id: 'S-B1', offsetMm: 0, widthMm: 600 },
        { id: 'S-D1', offsetMm: 600, widthMm: 800 },
        { id: 'S-S1', offsetMm: 1400, widthMm: 900 },
      ],
      expectedLengthMm: 3150, expectedOccupiedMm: 2300, expectedRemainingMm: 850,
    }],
  },
  {
    id: 'L',
    walls: [
      { id: 'L-W1', startMm: [0, 0], endMm: [3600, 0], thicknessMm: 150 },
      { id: 'L-W2', startMm: [3600, 0], endMm: [3600, 2900], thicknessMm: 150 },
    ],
    runs: [
      {
        id: 'L-R1', wallId: 'L-W1', startMm: 600, endMm: 3400,
        units: [
          { id: 'L-B1', offsetMm: 0, widthMm: 800 },
          { id: 'L-B2', offsetMm: 800, widthMm: 600 },
        ],
        expectedLengthMm: 2800, expectedOccupiedMm: 1400, expectedRemainingMm: 1400,
      },
      {
        id: 'L-R2', wallId: 'L-W2', startMm: 650, endMm: 2700,
        units: [
          { id: 'L-B3', offsetMm: 0, widthMm: 600 },
          { id: 'L-B4', offsetMm: 600, widthMm: 450 },
        ],
        expectedLengthMm: 2050, expectedOccupiedMm: 1050, expectedRemainingMm: 1000,
      },
    ],
  },
  {
    id: 'U',
    walls: [
      { id: 'U-W1', startMm: [0, 0], endMm: [3400, 0], thicknessMm: 150 },
      { id: 'U-W2', startMm: [3400, 0], endMm: [3400, 2700], thicknessMm: 150 },
      { id: 'U-W3', startMm: [3400, 2700], endMm: [0, 2700], thicknessMm: 150 },
    ],
    runs: [
      {
        id: 'U-R1', wallId: 'U-W1', startMm: 600, endMm: 3200,
        units: [
          { id: 'U-B1', offsetMm: 0, widthMm: 600 },
          { id: 'U-B2', offsetMm: 600, widthMm: 600 },
          { id: 'U-B3', offsetMm: 1200, widthMm: 600 },
        ],
        expectedLengthMm: 2600, expectedOccupiedMm: 1800, expectedRemainingMm: 800,
      },
      {
        id: 'U-R2', wallId: 'U-W2', startMm: 650, endMm: 2500,
        units: [
          { id: 'U-B4', offsetMm: 0, widthMm: 800 },
          { id: 'U-B5', offsetMm: 800, widthMm: 600 },
        ],
        expectedLengthMm: 1850, expectedOccupiedMm: 1400, expectedRemainingMm: 450,
      },
      {
        id: 'U-R3', wallId: 'U-W3', startMm: 600, endMm: 3200,
        units: [
          { id: 'U-B6', offsetMm: 0, widthMm: 600 },
          { id: 'U-B7', offsetMm: 600, widthMm: 900 },
        ],
        expectedLengthMm: 2600, expectedOccupiedMm: 1500, expectedRemainingMm: 1100,
      },
    ],
  },
]

describe('TASK-001 — shared Matbakh / Editor numerical kitchen fixtures', () => {
  test('input scenario IDs, wall connectivity and counts match baseline contract', () => {
    expect(FIXTURES.map((scene) => scene.id)).toEqual(['straight', 'L', 'U'])
    expect(FIXTURES.map((scene) => scene.runs.length)).toEqual([1, 2, 3])
    for (const scene of FIXTURES) {
      for (let i = 1; i < scene.walls.length; i++) {
        expect(scene.walls[i - 1]!.endMm).toEqual(scene.walls[i]!.startMm)
      }
    }
  })

  for (const scene of FIXTURES) {
    test(`${scene.id}: cabinet run extents, world-plan placement and mm to m to mm round-trip`, () => {
      for (const item of scene.runs) {
        const wall = scene.walls.find((wall) => wall.id === item.wallId)
        expect(wall).toBeDefined()
        if (!wall) throw new Error(`Unknown wall ${item.wallId}`)
        const dxMm = wall.endMm[0] - wall.startMm[0]
        const dzMm = wall.endMm[1] - wall.startMm[1]
        const wallLengthMm = Math.hypot(dxMm, dzMm)
        const spanMm = item.endMm - item.startMm
        expect(spanMm).toBe(item.expectedLengthMm)
        expect(item.endMm).toBeLessThanOrEqual(wallLengthMm)
        expect(wall.thicknessMm).toBeGreaterThan(0)

        // Editor's run local X is the wall vector. Its world-space X/Z
        // convention uses [cos(-rotation), -sin(-rotation)].
        const runMidMm = (item.startMm + item.endMm) / 2
        const run = CabinetNode.parse({
          id: `cabinet_${item.id}`,
          position: [
            (wall.startMm[0] + runMidMm * dxMm / wallLengthMm) / 1000,
            0,
            (wall.startMm[1] + runMidMm * dzMm / wallLengthMm) / 1000,
          ],
          rotation: -Math.atan2(dzMm, dxMm),
          width: spanMm / 1000,
          depth: 0.6,
          children: item.units.map((unit) => `cabinet-module_${unit.id}`),
        })
        const modules = item.units.map((unit) => CabinetModuleNode.parse({
          id: `cabinet-module_${unit.id}`,
          parentId: run.id,
          width: unit.widthMm / 1000,
          depth: 0.6,
          carcassHeight: 0.72,
          position: [
            (unit.offsetMm + unit.widthMm / 2 - spanMm / 2) / 1000,
            0,
            0,
          ],
        }))
        const before = JSON.stringify(modules)
        const extent = runLocalXExtent(modules)
        expect(extent).not.toBeNull()
        if (!extent) throw new Error('Empty run extent')
        expect(extent.minX * 1000).toBeCloseTo(-spanMm / 2, 7)
        expect(extent.width * 1000).toBeCloseTo(item.expectedOccupiedMm, 7)
        expect((spanMm / 2000 - extent.maxX) * 1000).toBeCloseTo(
          item.expectedRemainingMm,
          7,
        )

        const spans = getRunSpans(modules, { runTier: 'base' })
        expect(spans).toHaveLength(1)
        expect(spans[0]!.width * 1000).toBeCloseTo(item.expectedOccupiedMm, 7)
        expect(spans[0]!.hasCountertop).toBe(true)

        for (let i = 0; i < modules.length; i++) {
          const module = modules[i]!
          const specification = item.units[i]!
          expect(module.width * 1000).toBeCloseTo(specification.widthMm, 7)
          const left = moduleMinX(module)
          const right = moduleMaxX(module)
          expect((right - left) * 1000).toBeCloseTo(specification.widthMm, 7)
          const location = runLocalToPlan(run, [left, 0, 0])
          const fromWallStartMm = item.startMm + specification.offsetMm
          expect(location[0] * 1000).toBeCloseTo(
            wall.startMm[0] + fromWallStartMm * dxMm / wallLengthMm,
            7,
          )
          expect(location[2] * 1000).toBeCloseTo(
            wall.startMm[1] + fromWallStartMm * dzMm / wallLengthMm,
            7,
          )
          const inverse = planToRunLocal(run, ...[location[0], 0, location[2]])
          expect(inverse[0]).toBeCloseTo(left, 10)
          expect(inverse[2]).toBeCloseTo(0, 10)
          expect((module.width * 1000) / 1000).toBeCloseTo(module.width, 10)
        }
        expect(JSON.stringify(modules)).toBe(before)
      }
    })
  }
})
