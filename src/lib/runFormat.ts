import type { ClaudeParams, Run } from '../types'

const MODEL_LABELS: Record<string, string> = {
  'claude-haiku-4-5-20251001': 'HAIKU',
  'claude-sonnet-4-6': 'SONNET',
  'claude-opus-4-7': 'OPUS'
}

export function modelLabel(id: string): string {
  return MODEL_LABELS[id] ?? id
}

// Concatenated text output of a run (excludes thinking / tool blocks).
export function runText(run: Run): string {
  return run.output
    .filter(b => b.type === 'text')
    .map(b => b.text ?? '')
    .join('')
}

function toolsLabel(tools: ClaudeParams['tools']): string {
  const on: string[] = []
  if (tools.webSearch) on.push('web_search')
  if (tools.codeExec) on.push('code_exec')
  if (tools.webFetch) on.push('web_fetch')
  return on.join(', ')
}

interface ParamField {
  label: string
  get: (p: ClaudeParams) => string
}

const FIELDS: ParamField[] = [
  { label: 'model', get: p => modelLabel(p.model) },
  { label: 'temperature', get: p => p.temperature.toFixed(2) },
  { label: 'top-p', get: p => p.topP.toFixed(2) },
  { label: 'top-k', get: p => String(p.topK) },
  { label: 'max tokens', get: p => String(p.maxTokens) },
  { label: 'stream', get: p => (p.stream ? 'ON' : 'OFF') },
  { label: 'stop seq', get: p => p.stopSequences.join(', ') || '—' },
  { label: 'thinking', get: p => (p.thinkingEnabled ? `ON (${p.thinkingBudget})` : 'OFF') },
  { label: 'effort', get: p => p.effort },
  { label: 'service tier', get: p => p.serviceTier },
  { label: 'user id', get: p => p.userId || '—' },
  { label: 'cache', get: p => (p.cacheEnabled ? 'ON' : 'OFF') },
  { label: 'tools', get: p => toolsLabel(p.tools) || '—' },
  { label: 'tool choice', get: p => p.toolChoice },
  { label: 'container', get: p => p.container || '—' },
  { label: 'geo', get: p => p.inferenceGeo || '—' }
]

function trunc(s: string): string {
  if (!s) return '(empty)'
  return s.length > 28 ? s.slice(0, 28) + '…' : s
}

export interface ParamDelta {
  label: string
  from: string
  to: string
}

// Settings that differ between two runs (params + system prompt + input).
export function diffParams(a: Run, b: Run): ParamDelta[] {
  const deltas: ParamDelta[] = []
  for (const f of FIELDS) {
    const from = f.get(a.params)
    const to = f.get(b.params)
    if (from !== to) deltas.push({ label: f.label, from, to })
  }
  if (a.systemPrompt !== b.systemPrompt) {
    deltas.push({ label: 'system prompt', from: trunc(a.systemPrompt), to: trunc(b.systemPrompt) })
  }
  if (a.input.text !== b.input.text) {
    deltas.push({ label: 'input', from: trunc(a.input.text), to: trunc(b.input.text) })
  }
  return deltas
}

// Compact one-line summary of a run's key settings.
export function paramsSummary(run: Run): string {
  const p = run.params
  const parts = [modelLabel(p.model), `temp ${p.temperature.toFixed(2)}`, `${p.maxTokens} tok`]
  if (p.thinkingEnabled) parts.push('think')
  if (!p.stream) parts.push('no-stream')
  const tools = toolsLabel(p.tools)
  if (tools) parts.push(tools)
  return parts.join(' · ')
}
