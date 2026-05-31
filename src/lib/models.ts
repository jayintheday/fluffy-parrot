// Single source of truth for model metadata. Pure data + helpers (no React/browser deps)
// so both the renderer and electron/main.ts can import it.
// Source: platform.claude.com/docs/en/about-claude/models/overview + /pricing

export type ThinkingMode = 'manual' | 'adaptive'

export interface ModelPrice {
  input: number
  output: number
  cacheWrite5m: number
  cacheRead: number
}

export interface ModelInfo {
  id: string
  label: string // shown on the rotary selector + run summaries
  price: ModelPrice // USD per million tokens
  maxOutput: number // informational
  thinkingMode: ThinkingMode // how the THINK toggle is expressed in the request
  allowsSampling: boolean // temperature/top_p/top_k accepted? (Opus 4.7+ reject them)
  effortSupported: boolean // output_config.effort accepted? (Haiku 4.5 does not)
}

export const MODELS: ModelInfo[] = [
  {
    id: 'claude-haiku-4-5-20251001',
    label: 'HAIKU',
    price: { input: 1, output: 5, cacheWrite5m: 1.25, cacheRead: 0.1 },
    maxOutput: 64000,
    thinkingMode: 'manual',
    allowsSampling: true,
    effortSupported: false
  },
  {
    id: 'claude-sonnet-4-6',
    label: 'SONNET',
    price: { input: 3, output: 15, cacheWrite5m: 3.75, cacheRead: 0.3 },
    maxOutput: 64000,
    thinkingMode: 'manual',
    allowsSampling: true,
    effortSupported: true
  },
  {
    id: 'claude-opus-4-7',
    label: 'OPUS 4.7',
    price: { input: 5, output: 25, cacheWrite5m: 6.25, cacheRead: 0.5 },
    maxOutput: 128000,
    thinkingMode: 'adaptive',
    allowsSampling: false,
    effortSupported: true
  },
  {
    id: 'claude-opus-4-8',
    label: 'OPUS 4.8',
    price: { input: 5, output: 25, cacheWrite5m: 6.25, cacheRead: 0.5 },
    maxOutput: 128000,
    thinkingMode: 'adaptive',
    allowsSampling: false,
    effortSupported: true
  }
]

export function getModel(id: string): ModelInfo | undefined {
  return MODELS.find(m => m.id === id)
}

export function modelLabel(id: string): string {
  return getModel(id)?.label ?? id
}
