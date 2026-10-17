/**
 * TASK-001-B: real Editor web UI smoke, separate from numerical fixtures.
 *
 * Only runs against a disposable localhost development server/scene store.
 * It does NOT assert same-scene visual parity or manufacturing acceptance.
 */
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'

const require = createRequire('/tmp/task001-editor-playwright/package.json')
const { chromium } = require('playwright')
const output = 'task-001-editor-browser-evidence'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
const errors = []
const consoleProblems = []
const navigation = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => {
  if (message.type() === 'error' || message.type() === 'warning') consoleProblems.push(message.text())
})
page.on('framenavigated', frame => {
  if (frame === page.mainFrame()) navigation.push(frame.url())
})
const started = Date.now()
const evidence = { origin: 'http://127.0.0.1:3002', browser: 'chromium', tests: [], limitations: ['No Straight/L/U 3D scene imported by this smoke; numerical suite runs separately.', 'No factory-approved manufacturing calculations evaluated.'] }
try {
  const response = await page.goto('http://127.0.0.1:3002/', { waitUntil: 'domcontentloaded', timeout: 120_000 })
  assert.equal(response?.status(), 200, 'Editor homepage must return HTTP 200')
  await page.getByText('Local editor — scenes are not saved.').waitFor({ timeout: 120_000 })
  evidence.tests.push('Editor actual localhost app loaded; unsaved-home-mode notice visible')
  // The Editor deliberately mounts its toolbar *under* a full-page scene-loading
  // screen. A visible button is NOT yet actionable. Do not use force:true here:
  // that would bypass a real user-facing loading failure.
  const loadingOverlay = page.locator('div.fixed.inset-0.z-60')
  try {
    await loadingOverlay.waitFor({ state: 'hidden', timeout: 30_000 })
  } catch (readinessError) {
    evidence.readinessFailure = 'Editor loading overlay remained over toolbar for 30 seconds'
    evidence.loaderVisible = await loadingOverlay.isVisible().catch(() => null)
    evidence.currentUrl = page.url()
    evidence.navigation = navigation
    evidence.consoleProblems = consoleProblems.slice(-25)
    evidence.overlayText = await loadingOverlay.innerText().catch(() => '')
    evidence.failure = String(readinessError)
    throw readinessError
  }
  evidence.tests.push('Scene loading overlay cleared; actual toolbar is actionable')
  await page.getByRole('button', { name: '2D', exact: true }).click({ timeout: 20_000 })
  assert.equal(await page.getByRole('button', { name: '2D', exact: true }).getAttribute('aria-pressed'), 'true')
  await page.screenshot({ path: join(output, 'editor-empty-2d.png') })
  evidence.tests.push('2D mode interaction worked')
  await page.getByRole('button', { name: 'Split', exact: true }).click()
  assert.equal(await page.getByRole('button', { name: 'Split', exact: true }).getAttribute('aria-pressed'), 'true')
  await page.screenshot({ path: join(output, 'editor-empty-split.png') })
  evidence.tests.push('Split mode interaction worked')
  await page.getByRole('button', { name: '3D', exact: true }).click()
  assert.equal(await page.getByRole('button', { name: '3D', exact: true }).getAttribute('aria-pressed'), 'true')
  await page.locator('[data-pascal-viewer-3d] canvas').first().waitFor({ state: 'visible', timeout: 90_000 })
  await page.screenshot({ path: join(output, 'editor-empty-3d.png') })
  evidence.tests.push('3D canvas mounted on actual browser')
  evidence.initialUiLoadMs = Date.now() - started

  await page.goto('http://127.0.0.1:3002/scenes', { waitUntil: 'domcontentloaded', timeout: 120_000 })
  await page.getByRole('heading', { name: 'Your scenes' }).waitFor({ timeout: 90_000 })
  await page.getByRole('button', { name: 'Create new scene' }).first().click({ timeout: 60_000 })
  await page.waitForURL(/\/scene\/[^/]+/, { timeout: 90_000 })
  const sceneUrl = page.url()
  await page.screenshot({ path: join(output, 'editor-created-scene.png') })
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120_000 })
  assert.equal(new URL(page.url()).pathname, new URL(sceneUrl).pathname)
  assert.equal((await page.locator('body').innerText()).includes('not_found'), false)
  evidence.tests.push('Created a scene via UI and reopened same scene after reload')
  evidence.sceneIdTestOnly = new URL(sceneUrl).pathname.split('/').pop()
  evidence.noBrowserRuntimeErrors = errors.length === 0
  evidence.runtimeErrors = errors
  assert.deepEqual(errors, [], 'Browser runtime errors should be absent')
  await writeFile(join(output, 'results.json'), JSON.stringify(evidence, null, 2))
  process.stdout.write('TASK-001-B Editor UI PASS: ' + JSON.stringify(evidence.tests) + '\n')
} catch (error) {
  evidence.failure = String(error)
  evidence.runtimeErrors = errors
  evidence.consoleProblems = evidence.consoleProblems ?? consoleProblems.slice(-25)
  evidence.navigation = evidence.navigation ?? navigation
  console.error('TASK-001-B Editor UI diagnostic:', JSON.stringify({
    stage: evidence.tests.at(-1) ?? 'startup',
    failure: evidence.failure,
    readiness: evidence.readinessFailure ?? null,
    navigation: evidence.navigation.slice(-8),
    consoleProblems: evidence.consoleProblems.slice(-12),
  }))
  await page.screenshot({ path: join(output, 'failure.png') }).catch(() => undefined)
  await writeFile(join(output, 'results.json'), JSON.stringify(evidence, null, 2))
  throw error
} finally {
  await browser.close()
}
