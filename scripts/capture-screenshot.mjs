/**
 * Recapture docs/screenshot.png against the RUNNING GUI (default
 * http://127.0.0.1:3080): open the settings dialog, select our section,
 * expand a model row (default: the row whose card meta is `rowProvider`),
 * and shoot the viewport. Real page state beats a mockup — this is the only
 * honest way the shipped image exists.
 *   node scripts/capture-screenshot.mjs [url] [outPng] [rowProvider]
 * Needs BMP_CHROME_PATH (or a Chrome at the usual install spots).
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import puppeteer from 'puppeteer-core'

const url = process.argv[2] ?? 'http://127.0.0.1:3080'
const out = process.argv[3] ?? join(process.cwd(), 'docs', 'screenshot.png')
/** Provider whose card row expands in the shot (falls back to the first row). */
const rowProvider = process.argv[4]

const candidates = [
  process.env['BMP_CHROME_PATH'],
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
]
const chrome = candidates.find(candidate => candidate !== undefined && existsSync(candidate))
if (chrome === undefined) throw new Error('no Chrome-family executable found — set BMP_CHROME_PATH')

/** Click the first element matching [selector] whose visible text contains a needle. */
async function clickWithText(page, selector, needles) {
  const found = await page.evaluate((sel, list) => {
    for (const el of document.querySelectorAll(sel)) {
      const text = `${el.getAttribute('aria-label') ?? ''} ${el.textContent ?? ''}`
      if (list.some(needle => text.includes(needle))) {
        el.click()
        return true
      }
    }
    return false
  }, selector, needles)
  if (!found) throw new Error(`no ${selector} contains ${needles.join(',')}`)
}

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] })
try {
  const page = await browser.newPage()
  page.setDefaultTimeout(30_000)
  await page.setViewport({ width: 1240, height: 700 })
  await page.goto(url, { waitUntil: 'load', timeout: 60_000 })
  const dialog = await page.waitForSelector('button[aria-haspopup="dialog"]', { visible: true })
  await dialog?.click()
  // The settings modal's left nav announces our section by its registered label.
  await clickWithText(page, '[role="dialog"] button', ['模型能力', 'Model capabilities'])
  await page.waitForSelector('.bmp-modelRow', { visible: true })
  if (rowProvider !== undefined) {
    const found = await page.evaluate(name => {
      for (const card of document.querySelectorAll('.bmp-card')) {
        if (card.querySelector('.bmp-cardMeta')?.textContent?.trim() !== name) continue
        const button = card.querySelector('.bmp-modelRow button')
        if (button !== null) {
          button.click()
          return true
        }
      }
      return false
    }, rowProvider)
    if (!found) throw new Error(`no model row under provider card ${rowProvider}`)
  } else {
    await clickWithText(page, '.bmp-modelRow button', ['expand', '展开'])
  }
  await page.waitForSelector('.bmp-modelAdvanced', { visible: true })
  // Settle: the join re-render after expansion can reflow the card once.
  await new Promise(resolve => setTimeout(resolve, 400))
  await page.screenshot({ path: out })
  console.log(`screenshot captured -> ${out}`)
} finally {
  await browser.close()
}
