export type Attachment =
  | { kind: 'image'; mediaType: string; data: string; name: string }
  | { kind: 'pdf'; mediaType: 'application/pdf'; data: string; name: string }

export interface ContentBlock {
  type: 'text' | 'thinking' | 'tool_use' | 'tool_result'
  text?: string // text / thinking content
  name?: string // tool_use tool name, or tool_result source type
  input?: string // tool_use: accumulated JSON args
  result?: string // tool_result: rendered summary
}

export type Effort = 'off' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'
export type ToolChoice = 'auto' | 'any' | 'none'

export interface ClaudeParams {
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
  effort: Effort
  serviceTier: 'auto' | 'standard_only'
  userId: string
  cacheEnabled: boolean
  tools: { webSearch: boolean; codeExec: boolean; webFetch: boolean }
  toolChoice: ToolChoice
  container: string
  inferenceGeo: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  blocks: ContentBlock[]
  attachments?: Attachment[]
  streaming?: boolean
}

export interface TokenUsage {
  input: number
  output: number
}

export type RunStatus = 'streaming' | 'done' | 'error'

export interface Run {
  id: string
  index: number
  params: ClaudeParams
  systemPrompt: string
  input: { text: string; attachments: Attachment[] }
  output: ContentBlock[]
  tokenUsage: TokenUsage
  status: RunStatus
  createdAt: number
}

export type LEDState = 'off' | 'green' | 'amber' | 'red'

export type StreamEvent =
  | { kind: 'block_start'; index: number; blockType: ContentBlock['type']; name?: string }
  | { kind: 'delta'; index: number; text?: string; input?: string }
  | { kind: 'block_stop'; index: number }

declare global {
  interface Window {
    electronAPI: {
      hasKey: () => Promise<boolean>
      saveKey: (key: string) => Promise<boolean>
      sendMessage: (
        payload: object
      ) => Promise<{ blocks: ContentBlock[]; inputTokens: number; outputTokens: number } | null>
      onStreamEvent: (cb: (ev: StreamEvent) => void) => () => void
      onDone: (cb: (usage: { inputTokens: number; outputTokens: number }) => void) => () => void
    }
  }
}
