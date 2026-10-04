#!/usr/bin/env node
// Minimal control CLI for verifying FloodBeacon: starts the Vite dev server
// and a headless Chromium instance, then lets later invocations drive the
// same page and capture evidence. State persists in STATE_FILE so each CLI
// call (a fresh node process) can reconnect to the same browser/page.
//
// Usage:
//   node drive.mjs start [--port 5190]
//   node drive.mjs doctor
//   node drive.mjs goto <path>              # e.g. "/"
//   node drive.mjs click --role <role> --name <name>
//   node drive.mjs fill --role <role> --name <name> --value <value>
//   node drive.mjs press --key <key>
//   node drive.mjs wait --role <role> --name <name>
//   node drive.mjs screenshot --path <file>
//   node drive.mjs snapshot --path <file>   # ARIA tree dump
//   node drive.mjs console                  # print captured console/page errors
//   node drive.mjs stop

import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '../../../..')
const STATE_FILE = resolve(__dirname, '.state.json')
const LOG_FILE = resolve(__dirname, '.console.log')

function readState() {
  if (!existsSync(STATE_FILE)) {
    console.error('Not started. Run: node drive.mjs start')
    process.exit(1)
  }
  return JSON.parse(readFileSync(STATE_FILE, 'utf8'))
}

function writeState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

function parseFlags(args) {
  const flags = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      flags[args[i].slice(2)] = args[i + 1]
      i++
    }
  }
  return flags
}

async function waitForHttp(url, timeoutMs = 20000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status === 404) return true
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

async function connectPage(state) {
  // Raw CDP, not chromium.connect()/launchServer(): Playwright's own protocol
  // isolates contexts per connection, so a second CLI invocation would see no
  // pages at all. CDP exposes the browser's real state to every client.
  const browser = await chromium.connectOverCDP(state.cdpEndpoint)
  const context = browser.contexts()[0]
  const page = context.pages()[0]
  return { browser, page }
}

async function cmdStart(flags) {
  if (existsSync(STATE_FILE)) {
    console.error('Already started. Run `stop` first if this is stale.')
    process.exit(1)
  }
  const port = flags.port ?? '5190'
  const cdpPort = flags['cdp-port'] ?? '9222'
  const url = `http://localhost:${port}`
  const cdpEndpoint = `http://localhost:${cdpPort}`

  const devServer = spawn('npm', ['run', 'dev', '--', '--port', port, '--strictPort'], {
    cwd: REPO_ROOT,
    detached: true,
    stdio: 'ignore',
  })
  devServer.unref()

  await waitForHttp(url)

  // Spawn Chromium directly (not launch()/launchServer()) so it survives this
  // process exiting, and expose it over raw CDP so later CLI invocations can
  // reconnect and see the same contexts/pages.
  const browserProc = spawn(
    chromium.executablePath(),
    [
      `--remote-debugging-port=${cdpPort}`,
      '--headless=new',
      '--no-sandbox',
      '--user-data-dir=/tmp/floodbeacon-verify-profile',
      'about:blank',
    ],
    { detached: true, stdio: 'ignore' },
  )
  browserProc.unref()

  await waitForHttp(`${cdpEndpoint}/json/version`)

  const browser = await chromium.connectOverCDP(cdpEndpoint)
  const context = browser.contexts()[0] ?? (await browser.newContext())
  const page = (await context.pages())[0] ?? (await context.newPage())
  // CDP-created pages have no viewport by default (often <768px wide), which silently
  // trips this app's phone breakpoint. Pin a real desktop size unless overridden, e.g.
  // --viewport-width 390 --viewport-height 844 to deliberately test the phone layout.
  await page.setViewportSize({
    width: Number(flags['viewport-width'] ?? 1280),
    height: Number(flags['viewport-height'] ?? 800),
  })

  writeFileSync(LOG_FILE, '')
  page.on('console', (msg) => {
    writeFileSync(LOG_FILE, `[console:${msg.type()}] ${msg.text()}\n`, { flag: 'a' })
  })
  page.on('pageerror', (err) => {
    writeFileSync(LOG_FILE, `[pageerror] ${err.message}\n`, { flag: 'a' })
  })
  page.on('requestfailed', (req) => {
    writeFileSync(LOG_FILE, `[requestfailed] ${req.url()} ${req.failure()?.errorText}\n`, {
      flag: 'a',
    })
  })

  await page.goto(url, { waitUntil: 'networkidle' })
  await browser.close() // closes this CDP session only, not the browser process

  writeState({ port, url, cdpEndpoint, browserPid: browserProc.pid, devServerPid: devServer.pid })
  console.log(`started: ${url} (devServerPid=${devServer.pid}, browserPid=${browserProc.pid})`)
}

async function cmdDoctor() {
  const state = readState()
  const httpOk = await fetch(state.url)
    .then((r) => r.ok)
    .catch(() => false)
  let browserOk = false
  let title = null
  try {
    const { browser, page } = await connectPage(state)
    browserOk = browser.isConnected() && Boolean(page)
    title = page ? await page.title() : null
    await browser.close()
  } catch (err) {
    console.error('browser connect failed:', err.message)
  }
  console.log(
    JSON.stringify({ url: state.url, httpOk, browserOk, title, pids: [state.devServerPid, state.browserPid] }, null, 2),
  )
  if (!httpOk || !browserOk) process.exit(1)
}

async function cmdGoto(args) {
  const state = readState()
  const { browser, page } = await connectPage(state)
  const target = new URL(args[0] ?? '/', state.url).toString()
  await page.goto(target, { waitUntil: 'networkidle' })
  console.log(`at ${page.url()}`)
  await browser.close()
}

async function cmdClick(flags) {
  const state = readState()
  const { browser, page } = await connectPage(state)
  await page.getByRole(flags.role, { name: flags.name }).click()
  console.log(`clicked role=${flags.role} name="${flags.name}"`)
  await browser.close()
}

async function cmdFill(flags) {
  const state = readState()
  const { browser, page } = await connectPage(state)
  await page.getByRole(flags.role, { name: flags.name }).fill(flags.value)
  console.log(`filled role=${flags.role} name="${flags.name}" value="${flags.value}"`)
  await browser.close()
}

async function cmdPress(flags) {
  const state = readState()
  const { browser, page } = await connectPage(state)
  await page.keyboard.press(flags.key)
  console.log(`pressed ${flags.key}`)
  await browser.close()
}

async function cmdWait(flags) {
  const state = readState()
  const { browser, page } = await connectPage(state)
  await page.getByRole(flags.role, { name: flags.name }).waitFor({ state: 'visible', timeout: 10000 })
  console.log(`visible: role=${flags.role} name="${flags.name}"`)
  await browser.close()
}

async function cmdScreenshot(flags) {
  const state = readState()
  const { browser, page } = await connectPage(state)
  const path = resolve(REPO_ROOT, flags.path ?? 'artifacts/screenshot.png')
  mkdirSync(dirname(path), { recursive: true })
  await page.screenshot({ path })
  console.log(`saved ${path}`)
  await browser.close()
}

async function cmdSnapshot(flags) {
  const state = readState()
  const { browser, page } = await connectPage(state)
  const snapshot = await page.locator('body').ariaSnapshot()
  const path = resolve(REPO_ROOT, flags.path ?? 'artifacts/snapshot.yaml')
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, snapshot)
  console.log(`saved ${path}`)
  await browser.close()
}

async function cmdEval(args) {
  const state = readState()
  const { browser, page } = await connectPage(state)
  const expr = args[0]
  const result = await page.evaluate(expr)
  console.log(JSON.stringify(result, null, 2))
  await browser.close()
}

async function cmdConsole() {
  if (!existsSync(LOG_FILE)) {
    console.log('(no console log captured)')
    return
  }
  console.log(readFileSync(LOG_FILE, 'utf8'))
}

async function cmdStop() {
  const state = readState()
  try {
    const browser = await chromium.connect(state.wsEndpoint)
    await browser.close()
  } catch {
    // already gone
  }
  if (state.browserPid) {
    try {
      process.kill(-state.browserPid, 'SIGKILL')
    } catch {
      try {
        process.kill(state.browserPid, 'SIGKILL')
      } catch {
        // already gone
      }
    }
  }
  if (state.devServerPid) {
    try {
      process.kill(-state.devServerPid, 'SIGTERM')
    } catch {
      try {
        process.kill(state.devServerPid, 'SIGTERM')
      } catch {
        // already gone
      }
    }
  }
  rmSync(STATE_FILE, { force: true })
  console.log('stopped')
}

const [, , cmd, ...rest] = process.argv
const flags = parseFlags(rest)

const handlers = {
  start: () => cmdStart(flags),
  doctor: cmdDoctor,
  goto: () => cmdGoto(rest),
  click: () => cmdClick(flags),
  fill: () => cmdFill(flags),
  press: () => cmdPress(flags),
  wait: () => cmdWait(flags),
  screenshot: () => cmdScreenshot(flags),
  snapshot: () => cmdSnapshot(flags),
  eval: () => cmdEval(rest),
  console: cmdConsole,
  stop: cmdStop,
}

if (!handlers[cmd]) {
  console.error(`Unknown command: ${cmd}`)
  console.error(`Known commands: ${Object.keys(handlers).join(', ')}`)
  process.exit(1)
}

await handlers[cmd]()
