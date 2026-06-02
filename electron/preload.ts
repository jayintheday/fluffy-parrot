import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  hasKey: (): Promise<boolean> => ipcRenderer.invoke('api:hasKey'),
  saveKey: (key: string): Promise<boolean> => ipcRenderer.invoke('api:saveKey', key),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:openExternal', url),
  sendMessage: (payload: object): Promise<{ text: string; inputTokens: number; outputTokens: number } | null> =>
    ipcRenderer.invoke('api:sendMessage', payload),
  onStreamEvent: (cb: (ev: unknown) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: unknown) => cb(data)
    ipcRenderer.on('api:stream', handler)
    return () => ipcRenderer.off('api:stream', handler)
  },
  onDone: (cb: (usage: { inputTokens: number; outputTokens: number; cacheWriteTokens: number; cacheReadTokens: number; webSearches: number; timing?: { ttftMs: number; totalMs: number } }) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: { inputTokens: number; outputTokens: number; cacheWriteTokens: number; cacheReadTokens: number; webSearches: number; timing?: { ttftMs: number; totalMs: number } }) => cb(data)
    ipcRenderer.on('api:done', handler)
    return () => ipcRenderer.off('api:done', handler)
  }
})
