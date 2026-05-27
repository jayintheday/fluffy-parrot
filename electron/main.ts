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

// IPC: send message with streaming
ipcMain.handle('api:sendMessage', async (event, payload: {
  apiKey?: string
  model: string
  temperature: number
  topP: number
  topK: number
  maxTokens: number
  stream: boolean
  systemPrompt: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}) => {
  const key = storedApiKey || payload.apiKey
  if (!key) throw new Error('No API key')

  const client = new Anthropic({ apiKey: key })

  // API rejects having both temperature and top_p — send top_p only when explicitly set below max
  const topPChanged = payload.topP < 0.999
  const buildParams = {
    model: payload.model,
    max_tokens: payload.maxTokens,
    ...(topPChanged ? { top_p: payload.topP } : { temperature: payload.temperature }),
    ...(payload.topK > 0 ? { top_k: payload.topK } : {}),
    ...(payload.systemPrompt ? { system: payload.systemPrompt } : {}),
    messages: payload.messages
  } as const

  if (!payload.stream) {
    const response = await client.messages.create({ ...buildParams, stream: false })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return { text, inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens }
  }

  // streaming
  const stream = await client.messages.stream(buildParams)
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      event.sender.send('api:chunk', { delta: chunk.delta.text })
    }
  }
  const final = await stream.finalMessage()
  event.sender.send('api:done', {
    inputTokens: final.usage.input_tokens,
    outputTokens: final.usage.output_tokens
  })
  return null
})
