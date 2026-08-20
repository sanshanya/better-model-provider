/**
 * Live FUNCTIONAL gate — the one tier spanning the whole system boundary: a
 * REAL harness serves a REAL profile to a REAL browser. Hermetic tests prove
 * the logic; this one proves the boundary conducts. Opt-in: CONTRIBUTING.md
 * (BMP_DSH_DIR + BMP_CHROME_PATH).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import puppeteer, { type Browser, type Page } from 'puppeteer-core'
import { beforeAll, afterAll, describe, expect, test } from 'vitest'
import { liveBoot, liveBootAvailable, type LiveBoot } from './live-boot.ts'

const CHROME = process.env['BMP_CHROME_PATH']
const AVAILABLE = liveBootAvailable() && CHROME !== undefined

describe.skipIf(!AVAILABLE)('live harness functional workflow', () => {
  let boot: LiveBoot
  let browser: Browser
  let page: Page

  const settingsYaml = (): string => readFileSync(join(boot.dshHome, 'settings.yaml'), 'utf8')

  /** Poll the persisted settings document until a predicate holds (async writes race a single read). */
  async function waitForYaml(predicate: (yaml: string) => boolean): Promise<void> {
    const start = Date.now()
    while (Date.now() - start < 60_000) {
      if (predicate(settingsYaml())) return
      await new Promise(resolve => setTimeout(resolve, 250))
    }
    throw new Error(`settings.yaml never reached the expected state; it reads:\n${settingsYaml()}`)
  }

  beforeAll(async () => {
    boot = await liveBoot({
      seeds: {
        // The document is namespace-keyed at the top; the plugin edits the
        // llm-pi-ai section. Profile shape mirrors the real wire contract.
        'settings.yaml': [
          'llm-pi-ai:',
          '  providers:',
          '    ksyun:',
          '      apiKeyEnv: BMP_FUNC_KEY',
          '      api: openai-completions',
          '      baseURL: http://127.0.0.1:1/v1',
          '      models:',
          '        - id: Kimi-K3',
          '          name: Kimi-k3',
          // A catalog route on a dead proxy baseURL: its discovery must come
          // from the installed catalog, never from this endpoint.
          '    openai:',
          '      apiKeyEnv: BMP_FUNC_KEY',
          '      baseURL: http://127.0.0.1:1/v1',
          '',
        ].join('\n'),
      },
      env: { BMP_FUNC_KEY: 'live-functionality-probe' },
    })
    if (CHROME === undefined) throw new Error('BMP_CHROME_PATH is unset')
    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    })
    page = await browser.newPage()
    page.setDefaultTimeout(60_000)
    page.on('pageerror', error => console.log('PAGEERR', error instanceof Error ? error.message : String(error)))
    page.on('console', msg => { if (msg.type() === 'error') console.log('PGC', msg.text().slice(0, 200)) })
    await page.goto(boot.url, { waitUntil: 'load', timeout: 120_000 })
    // The SPA keeps a long-lived WebSocket, so networkidle never settles; the
    // real readiness marker is the rendered shell chrome.
    await page.waitForSelector('button, [role=button]', { visible: true, timeout: 60_000 })
  }, 300_000)

  afterAll(async () => {
    await browser?.close()
    boot?.dispose()
  })

  /** Dump the actionable DOM for a clickWithText miss. */
  async function scanDom(): Promise<void> {
    const summary = await page.evaluate(() => {
      const pick = (el: Element): string => `${el.tagName.toLowerCase()} [aria-label=${el.getAttribute('aria-label')}][title=${el.getAttribute('title')}] text=${(el.textContent ?? '').slice(0, 24).trim()}`
      const cands = [...document.querySelectorAll('button, a, [role=button]')]
      return cands.slice(0, 40).map(pick).join('; ') + ` | all-count=${cands.length}`
    })
    console.log(`DOMSCAN ${summary}`)
  }

  /** Expand the first model row when collapsed; leaves an expanded row alone. */
  async function ensureExpanded(): Promise<void> {
    const advanced = await page.$('.bmp-modelAdvanced')
    if (advanced) return
    await clickWithText('.bmp-modelRow button', ['expand', '展开'])
    await page.waitForSelector('.bmp-modelAdvanced', { visible: true })
  }

  /** Switch one capability editor (by aria-label) of the expanded row into custom mode. */
  async function setCapabilityCustom(list: readonly string[]): Promise<void> {
    await page.evaluate(async list2 => {
      for (const sel of document.querySelectorAll('.bmp-select')) {
        const aria = sel.getAttribute('aria-label') ?? ''
        for (const needle of list2) {
          if (aria.includes(needle)) {
            const select = sel as HTMLSelectElement
            select.value = 'custom'
            select.dispatchEvent(new Event('change', { bubbles: true }))
            return
          }
        }
      }
    }, [...list])
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  /** Put the reasoning editor into custom mode and open its level picker. */
  async function openReasoningPicker(): Promise<void> {
    await setCapabilityCustom(['reasoning', 'Reasoning', '推理强度'])
    // Boot-time document-updated invalidations re-render the row after our
    // click, killing the toggled node on a detached button — retry the
    // toggle bounded instead of trusting one click.
    const wrap = await page
      .waitForSelector('.bmp-msWrap button[aria-haspopup="dialog"]', { visible: true })
      .catch(async () => {
        const dump = await page.evaluate(() =>
          [...document.querySelectorAll('button, select')]
            .map(el => `${el.tagName}[${String(el.className).split(' ')[0]}] ${(el.textContent ?? '').trim().slice(0, 24)} ~${el.getAttribute('aria-label') ?? ''}`)
            .slice(0, 50)
            .join('\n'))
        throw new Error(`picker button never appeared; page buttons/selects:\n${dump}`)
      })
    expect(wrap).toBeDefined()
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await clickWithText('.bmp-msWrap button', ['已选择', 'selected'])
      const open = await page.waitForSelector('.bmp-msItem input[type="checkbox"]', { timeout: 3_000 })
        .catch(() => null)
      if (open !== null) return
    }
    throw new Error('reasoning picker never opened its panel after 4 toggles')
  }

  /** Type into one capacity field (by aria-label) of the expanded row, optionally scoped to one provider card. */
  async function typeCapacity(needles: readonly string[], text: string, provider?: string): Promise<void> {
    const found = await page.evaluate((list, value, name) => {
      const roots: ParentNode[] = name === undefined
        ? [document]
        : [...document.querySelectorAll('.bmp-card')].filter(card =>
            card.querySelector('.bmp-cardMeta')?.textContent?.trim() === name)
      for (const root of roots) for (const input of root.querySelectorAll('.bmp-input')) {
        const aria = input.getAttribute('aria-label') ?? ''
        if (list.some(needle => aria.includes(needle))) {
          const el = input as HTMLInputElement
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
          setter?.call(el, value)
          el.dispatchEvent(new Event('input', { bubbles: true }))
          return true
        }
      }
      return false
    }, [...needles], text, provider)
    if (!found) throw new Error(`no capacity input matches ${needles.join(',')}`)
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  /** Expand the first model row of the card whose meta names one provider. */
  async function expandCardRow(provider: string): Promise<void> {
    const ok = await page.evaluate(name => {
      for (const card of document.querySelectorAll('.bmp-card')) {
        if (card.querySelector('.bmp-cardMeta')?.textContent?.trim() !== name) continue
        const row = card.querySelector('.bmp-modelRow')
        if (!row) return false
        if (!row.querySelector('.bmp-modelAdvanced')) {
          (row.querySelector('.bmp-modelMain .bmp-icon') as HTMLButtonElement | null)?.click()
        }
        return true
      }
      return false
    }, provider)
    if (!ok) {
      const cards = await page.evaluate(() =>
        [...document.querySelectorAll('.bmp-card')]
          .map(card => `${card.querySelector('.bmp-cardMeta')?.textContent?.trim() ?? '?'}[rows=${card.querySelectorAll('.bmp-modelRow').length}]`)
          .join(' '))
      throw new Error(`no card with a model row for provider "${provider}"; cards: ${cards}; yaml:\n${settingsYaml()}`)
    }
    await page.waitForSelector('.bmp-modelAdvanced', { visible: true })
  }

  /** Click the first match whose accessible text contains a needle — locale-proof over both dictionaries, optionally scoped to one provider card. */
  async function clickWithText(selector: string, needles: readonly string[], provider?: string): Promise<void> {
    const found = await page.evaluate((sel, list, name) => {
      const roots: ParentNode[] = name === undefined
        ? [document]
        : [...document.querySelectorAll('.bmp-card')].filter(card =>
            card.querySelector('.bmp-cardMeta')?.textContent?.trim() === name)
      for (const root of roots) for (const el of root.querySelectorAll(sel)) {
        const aria = el.getAttribute('aria-label') ?? ''
        const title = el.getAttribute('title') ?? ''
        const parentTitle = el.closest('[title]')?.getAttribute('title') ?? ''
        const text = [el.textContent ?? '', el.closest('label')?.textContent ?? '', title, parentTitle].join(' ')
        if (list.some(needle => aria.trim() === needle) || list.some(needle => text.includes(needle))) {
          (el as HTMLElement).click()
          return true
        }
      }
      return false
    }, selector, [...needles], provider)
    if (!found) {
      const html = await page.evaluate(() => {
        const rows = [...document.querySelectorAll('.bmp-modelRow')]
        const probe = rows[0] ? rows[0].outerHTML.slice(0, 700) : '<no modelRow>'
        const remained = (document.querySelector('.bmp-section') ?? document.body).innerHTML.slice(0, 300)
        return `row0=${probe} | section=${remained}`
      }, selector)
      throw new Error(`no ${selector} contains ${needles.join(',')}; dump: ${html}`)
    }
  }

  /** Open our settings section (slot-driven shell; the trigger's aria-haspopup=dialog is the locale-proof handle). */
  async function openSection(): Promise<void> {
    // The settings trigger announces the modal: aria-haspopup=dialog —
    // the only locale-proof handle the shell gives us.
    const trigger = await page.evaluate(() => {
      const el = document.querySelector('button[aria-haspopup="dialog"]')
      if (el instanceof HTMLElement) { el.click(); return true }
      return false
    })
    if (!trigger) {
      await scanDom()
      throw new Error('settings trigger absent: no aria-haspopup=dialog button')
    }
    // The panel opens on its FIRST nav row; our section only mounts when its
    // nav entry is activated.
    await page.waitForSelector('[role=dialog]', { visible: true, timeout: 60_000 })
    await clickWithText('button', ['模型能力', 'Model capabilities'])
    await page.waitForSelector('.bmp-section', { visible: true, timeout: 60_000 })
    // A real join against a real harness is NOT instant; the loading state
    // and the directory join each get their fair window, and failing here
    // must print the section's own words.
    try {
      await page.waitForSelector('.bmp-modelRow', { visible: true, timeout: 60_000 })
    } catch {
      const sectionText = await page.evaluate(() => document.querySelector('.bmp-section')?.textContent?.slice(0, 400) ?? '<no section>')
      throw new Error(`section never produced a model row; section reads: ${sectionText}`)
    }
  }

  test('the section loads from the real schema and the row renders its vocabulary', { timeout: 180_000 }, async () => {
    await openSection()
    await ensureExpanded()
    await openReasoningPicker()
    // Schema-derived evidence on the REAL envelope: the full vocabulary the
    // adapter declares must now appear — the bug that silently emptied it was
    // allowed to sit behind hermetic ministers for a whole audit round.
    const vocabulary = await page.$$eval('.bmp-msItem span',
      spans => Array.from(new Set(spans.map(span => span.textContent?.trim()).filter((s): s is string => s !== undefined && s.length > 0))))
    for (const level of ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']) {
      expect(vocabulary).toContain(level)
    }
    // Modalities render in a custom-input grid too; switch that one too.
    await setCapabilityCustom(['input', '模态', 'modalit'])
    const modalities = await page.$$eval('.bmp-modalityRow .bmp-toggle span',
      spans => Array.from(new Set(spans.map(span => span.textContent?.trim()).filter((s): s is string => s !== undefined && s.length > 0))))
    for (const modality of ['text', 'image']) {
      expect(modalities).toContain(modality)
    }
  })

  test('a capability write persists into settings.yaml, and reverting it removes the leaf', { timeout: 180_000 }, async () => {
    await ensureExpanded()
    await openReasoningPicker()

    // Tick 'low' in the collapsed picker and apply.
    await clickWithText('.bmp-msItem input[type="checkbox"]', ['low'])
    await clickWithText('button', ['应用', 'Apply'])
    // The staged badge disappears once the write completes.
    await page.waitForFunction(() => !document.querySelector('.bmp-staged'), { timeout: 60_000 })
    expect(settingsYaml()).toContain('low: low')

    // A capacity write lands as a plain count in the same profile.
    await typeCapacity(['Context window', '上下文窗口'], '380K')
    await clickWithText('button', ['应用', 'Apply'])
    await page.waitForFunction(() => !document.querySelector('.bmp-staged'), { timeout: 60_000 })
    expect(settingsYaml()).toContain('contextWindow: 380000')

    // Revert the capability: 'low' unchecked + apply → the leaf lifts.
    await clickWithText('.bmp-msItem input[type="checkbox"]', ['low'])
    await clickWithText('button', ['应用', 'Apply'])
    await page.waitForFunction(() => !document.querySelector('.bmp-staged'), { timeout: 60_000 })
    expect(settingsYaml()).not.toContain('low: low')

    // Clearing the capacity text lifts its leaf too.
    await typeCapacity(['Context window', '上下文窗口'], '')
    await clickWithText('button', ['应用', 'Apply'])
    await page.waitForFunction(() => !document.querySelector('.bmp-staged'), { timeout: 60_000 })
    expect(settingsYaml()).not.toContain('contextWindow: 380000')
  })

  test('a catalog override persists into settings.yaml, and resetting lifts it', { timeout: 180_000 }, async () => {
    // Runs LAST: earlier tests leave the declared row open and DOM ordering
    // puts catalog cards first, so capacity typing lands on the official row.
    // The dead proxy baseURL must not matter: the manage gate's discovery
    // comes from the installed catalog, so the official list renders anyway.
    await clickWithText('button', ['管理官方模型', 'Manage official models'])
    await page.waitForSelector('.bmp-modelRow', { visible: true, timeout: 60_000 })
    await expandCardRow('openai')
    // Official capacity baselines render — the installed catalog answers them.
    await page.waitForFunction(
      () => document.body.textContent?.includes('官方：') === true || document.body.textContent?.includes('Official:') === true,
      { timeout: 60_000 },
    )
    await typeCapacity(['Context window', '上下文窗口'], '64K')
    await clickWithText('button', ['应用', 'Apply'], 'openai')
    await waitForYaml(yaml => yaml.includes('modelOverrides:') && yaml.includes('contextWindow: 64000'))

    await clickWithText('button', ['还原为官方默认', 'Reset to official defaults'], 'openai')
    await waitForYaml(yaml => !yaml.includes('contextWindow: 64000'))
  })

  test('a dormant catalog route onboards on its first override write', { timeout: 180_000 }, async () => {
    // Anthropic ships in the installed catalog but nothing seeds a profile
    // for it: it waits collapsed behind the add button, manages from the
    // installed catalog, and the first override write materializes the route
    // in settings.yaml even though no credential exists.
    expect(settingsYaml()).not.toContain('anthropic:')
    await clickWithText('button', ['管理官方供应商', 'Manage official providers'])
    // The region lists one compact row per provider; picking it unfolds the card.
    const rowFound = await page.evaluate(() => {
      for (const el of document.querySelectorAll('.bmp-dormantRow')) {
        if (el.querySelector('.bmp-cardMeta')?.textContent?.trim() === 'anthropic') {
          (el as HTMLElement).click()
          return true
        }
      }
      return false
    })
    if (!rowFound) throw new Error('no dormant row for anthropic')
    await clickWithText('button', ['管理官方模型', 'Manage official models'])
    await page.waitForFunction(name =>
      [...document.querySelectorAll('.bmp-card')].some(card =>
        card.querySelector('.bmp-cardMeta')?.textContent?.trim() === name
        && card.querySelector('.bmp-modelRow') !== null),
    { timeout: 60_000 }, 'anthropic')
    await expandCardRow('anthropic')
    await typeCapacity(['Context window', '上下文窗口'], '64K', 'anthropic')
    await clickWithText('button', ['应用', 'Apply'], 'anthropic')
    await waitForYaml(yaml => yaml.includes('anthropic:') && yaml.includes('contextWindow: 64000'))
    // The first write configures the route: the card jumps from the dormant
    // region into the configured list, re-mounting with its manage gate
    // closed — manage it again before the row shows.
    await clickWithText('button', ['管理官方模型', 'Manage official models'])
    await page.waitForFunction(name =>
      [...document.querySelectorAll('.bmp-card')].some(card =>
        card.querySelector('.bmp-cardMeta')?.textContent?.trim() === name
        && card.querySelector('.bmp-modelRow') !== null),
    { timeout: 60_000 }, 'anthropic')
    await expandCardRow('anthropic')
    await clickWithText('button', ['还原为官方默认', 'Reset to official defaults'], 'anthropic')
    await waitForYaml(yaml => !yaml.includes('contextWindow: 64000'))
    // Full closure: the onboarding-minted shell profile lifts with the last
    // override — the route returns to the dormant list, no ghost `{}` active.
    await waitForYaml(yaml => !yaml.includes('anthropic:'))
    await page.waitForFunction(
      name => [...document.querySelectorAll('.bmp-dormantRow')].some(row =>
        row.querySelector('.bmp-cardMeta')?.textContent?.trim() === name),
      { timeout: 60_000 }, 'anthropic')
  })
})
