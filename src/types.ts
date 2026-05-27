export interface ClaudeParams {
  model: string
  temperature: number
  topP: number
  topK: number
  maxTokens: number
  stream: boolean
  systemPrompt: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

export interface TokenUsage {
  input: number
  output: number
}

export type LEDState = 'off' | 'green' | 'amber' | 'red'

declare global {
  interface Window {
    electronAPI: {
      hasKey: () => Promise<boolean>
      saveKey: (key: string) => Promise<boolean>
      sendMessage: (payload: object) => Promise<{ text: string; inputTokens: number; outputTokens: number } | null>
      onChunk: (cb: (delta: string) => void) => () => void
      onDone: (cb: (usage: { inputTokens: number; outputTokens: number }) => void) => () => void
    }
  }
}
