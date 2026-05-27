import { app, BrowserWindow, ipcMain, safeStorage, shell } from 'electron'
import { join } from 'path'
import Anthropic from '@anthropic-ai/sdk'

let mainWindow: BrowserWindow | null = null
let storedApiKey: string | null = null
const KEY_FILE = join(app.getPath('userData'), 'api-key.enc')

async function loadApiKey(): Promise<void> {
  try {
    const { readFile } = await import('fs/promises')
    const encrypted = await readFile(KEY_FILE)
    if (safeStorage.isEncryptionAvailable()) {
      storedApiKey = safeStorage.decryptString(encrypted)
    }
  } catch {
    // no key stored yet
  }
}

async function saveApiKey(key: string): Promise<void> {
  const { writeFile } = await import('fs/promises')
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(key)
    await writeFile(KEY_FILE, encrypted)
    storedApiKey = key
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 900,
    minHeight: 620,
    maxWidth: 1400,
    maxHeight: 900,
    frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 14, y: 14 },
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(async () => {
  await loadApiKey()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC: get stored key status
ipcMain.handle('api:hasKey', () => !!storedApiKey)

// IPC: save key
ipcMain.handle('api:saveKey', async (_, key: string) => {
  await saveApiKey(key)
  return true
})

// Server-tool type strings + their beta headers, kept in one place for easy bumping.
const TOOLS = {
  webSearch: { type: 'web_search_20250305', name: 'web_search', beta: null as string | null },
  codeExec: { type: 'code_execution_20250522', name: 'code_execution', beta: 'code-execution-2025-05-22' },
  webFetch: { type: 'web_fetch_20250910', name: 'web_fetch', beta: 'web-fetch-2025-09-10' }
}

interface SendPayload {
  apiKey?: string
  model: string
  temperature: number
  topP: number
  topK: number
  maxTokens: number
  stream: boolean
  systemPrompt: string
  stopSequences: string[]
  thinkingEnabled: boolean
  thinkingBudget: number
  effort: string
  serviceTier: string
  userId: string
  cacheEnabled: boolean
  tools: { webSearch: boolean; codeExec: boolean; webFetch: boolean }
  toolChoice: string
  container: string
  inferenceGeo: string
  messages: Array<{ role: 'user' | 'assistant'; content: unknown }>
}

// Normalize an API usage object into the renderer's token-usage shape (incl. cache + web search).
function extractUsage(usage: any) {
  return {
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
    cacheWriteTokens: usage?.cache_creation_input_tokens ?? 0,
    cacheReadTokens: usage?.cache_read_input_tokens ?? 0,
    webSearches: usage?.server_tool_use?.web_search_requests ?? 0
  }
}

// Map an API content block into the renderer's flat ContentBlock shape.
function mapBlock(b: any): { type: string; text?: string; name?: string; input?: string; result?: string } {
  if (b.type === 'text') return { type: 'text', text: b.text }
  if (b.type === 'thinking') return { type: 'thinking', text: b.thinking }
  if (b.type === 'tool_use' || b.type === 'server_tool_use')
    return { type: 'tool_use', name: b.name, input: JSON.stringify(b.input ?? {}) }
  // tool_result variants (web_search_tool_result, code_execution_tool_result, web_fetch_tool_result, …)
  return { type: 'tool_result', name: b.type, result: JSON.stringify(b.content ?? b).slice(0, 4000) }
}

// IPC: send message with streaming
ipcMain.handle('api:sendMessage', async (event, payload: SendPayload) => {
  const key = storedApiKey || payload.apiKey
  if (!key) throw new Error('No API key')

  const thinkingOn = payload.thinkingEnabled
  // API rejects having both temperature and top_p — send top_p only when explicitly set below max
  const topPChanged = payload.topP < 0.999

  const buildParams: Record<string, any> = {
    model: payload.model,
    max_tokens: payload.maxTokens,
    messages: payload.messages
  }

  // Extended thinking forbids temperature/top_p/top_k — omit all sampling params when it's on.
  if (!thinkingOn) {
    if (topPChanged) buildParams.top_p = payload.topP
    else buildParams.temperature = payload.temperature
    if (payload.topK > 0) buildParams.top_k = payload.topK
  } else {
    buildParams.thinking = { type: 'enabled', budget_tokens: payload.thinkingBudget }
  }

  if (payload.systemPrompt) {
    buildParams.system = payload.cacheEnabled
      ? [{ type: 'text', text: payload.systemPrompt, cache_control: { type: 'ephemeral' } }]
      : payload.systemPrompt
  }
  if (payload.stopSequences?.length) buildParams.stop_sequences = payload.stopSequences
  if (payload.effort && payload.effort !== 'off') buildParams.output_config = { effort: payload.effort }
  if (payload.serviceTier === 'standard_only') buildParams.service_tier = 'standard_only'
  if (payload.userId) buildParams.metadata = { user_id: payload.userId }
  if (payload.container) buildParams.container = payload.container
  if (payload.inferenceGeo) buildParams.inference_geo = payload.inferenceGeo

  // Built-in server tools (execute server-side; no client tool-result loop needed).
  const tools: any[] = []
  const betas: string[] = []
  if (payload.tools?.webSearch) tools.push({ type: TOOLS.webSearch.type, name: TOOLS.webSearch.name })
  if (payload.tools?.codeExec) {
    tools.push({ type: TOOLS.codeExec.type, name: TOOLS.codeExec.name })
    if (TOOLS.codeExec.beta) betas.push(TOOLS.codeExec.beta)
  }
  if (payload.tools?.webFetch) {
    tools.push({ type: TOOLS.webFetch.type, name: TOOLS.webFetch.name })
    if (TOOLS.webFetch.beta) betas.push(TOOLS.webFetch.beta)
  }
  if (tools.length) {
    buildParams.tools = tools
    if (payload.toolChoice && payload.toolChoice !== 'auto') buildParams.tool_choice = { type: payload.toolChoice }
  }

  const client = new Anthropic({
    apiKey: key,
    ...(betas.length ? { defaultHeaders: { 'anthropic-beta': betas.join(',') } } : {})
  })

  if (!payload.stream) {
    const response = await client.messages.create({ ...buildParams, stream: false } as any)
    const blocks = (response.content as any[]).map(mapBlock)
    return { blocks, ...extractUsage(response.usage) }
  }

  // streaming
  const stream = client.messages.stream(buildParams as any)
  for await (const ev of stream as any) {
    if (ev.type === 'content_block_start') {
      const b = ev.content_block
      const mapped = mapBlock(b)
      event.sender.send('api:stream', {
        kind: 'block_start',
        index: ev.index,
        blockType: mapped.type,
        name: mapped.name
      })
      // Server tool_result blocks arrive fully formed (not streamed) — forward the result now.
      if (mapped.type === 'tool_result' && mapped.result) {
        event.sender.send('api:stream', { kind: 'delta', index: ev.index, text: mapped.result })
      }
    } else if (ev.type === 'content_block_delta') {
      const d = ev.delta
      if (d.type === 'text_delta') event.sender.send('api:stream', { kind: 'delta', index: ev.index, text: d.text })
      else if (d.type === 'thinking_delta')
        event.sender.send('api:stream', { kind: 'delta', index: ev.index, text: d.thinking })
      else if (d.type === 'input_json_delta')
        event.sender.send('api:stream', { kind: 'delta', index: ev.index, input: d.partial_json })
    } else if (ev.type === 'content_block_stop') {
      event.sender.send('api:stream', { kind: 'block_stop', index: ev.index })
    }
  }
  const final = await stream.finalMessage()
  event.sender.send('api:done', extractUsage(final.usage))
  return null
})
