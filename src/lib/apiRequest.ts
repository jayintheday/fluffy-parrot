import type { ClaudeParams, Run } from '../types'
import { computeCost, formatCost } from './pricing'

// NOTE: this mirrors the request builder in electron/main.ts (api:sendMessage).
// Keep the two in sync — server-tool versions, beta headers, and the temp/top_p
// and thinking rules must match what the app actually sends.
const TOOLS = {
  webSearch: { type: 'web_search_20250305', name: 'web_search', beta: null as string | null },
  codeExec: { type: 'code_execution_20250522', name: 'code_execution', beta: 'code-execution-2025-05-22' },
  webFetch: { type: 'web_fetch_20250910', name: 'web_fetch', beta: 'web-fetch-2025-09-10' }
}

// Build the Messages API request body (minus `messages`) + the beta headers it needs.
export function buildApiRequest(p: ClaudeParams): { body: Record<string, unknown>; betas: string[] } {
  const thinkingOn = p.thinkingEnabled
  const topPChanged = p.topP < 0.999
  const body: Record<string, unknown> = { model: p.model, max_tokens: p.maxTokens }

  // Extended thinking forbids temperature/top_p/top_k.
  if (!thinkingOn) {
    if (topPChanged) body.top_p = p.topP
    else body.temperature = p.temperature
    if (p.topK > 0) body.top_k = p.topK
  } else {
    body.thinking = { type: 'enabled', budget_tokens: p.thinkingBudget }
  }

  if (p.systemPrompt) {
    body.system = p.cacheEnabled
      ? [{ type: 'text', text: p.systemPrompt, cache_control: { type: 'ephemeral' } }]
      : p.systemPrompt
  }
  if (p.stopSequences?.length) body.stop_sequences = p.stopSequences
  if (p.effort && p.effort !== 'off') body.output_config = { effort: p.effort }
  if (p.serviceTier === 'standard_only') body.service_tier = 'standard_only'
  if (p.userId) body.metadata = { user_id: p.userId }
  if (p.container) body.container = p.container
  if (p.inferenceGeo) body.inference_geo = p.inferenceGeo

  const tools: unknown[] = []
  const betas: string[] = []
  if (p.tools.webSearch) tools.push({ type: TOOLS.webSearch.type, name: TOOLS.webSearch.name })
  if (p.tools.codeExec) {
    tools.push({ type: TOOLS.codeExec.type, name: TOOLS.codeExec.name })
    if (TOOLS.codeExec.beta) betas.push(TOOLS.codeExec.beta)
  }
  if (p.tools.webFetch) {
    tools.push({ type: TOOLS.webFetch.type, name: TOOLS.webFetch.name })
    if (TOOLS.webFetch.beta) betas.push(TOOLS.webFetch.beta)
  }
  if (tools.length) {
    body.tools = tools
    if (p.toolChoice && p.toolChoice !== 'auto') body.tool_choice = { type: p.toolChoice }
  }

  body.stream = p.stream
  return { body, betas }
}

// Assemble the full hand-off object for a run: exact request config + headers + reference context.
export function buildRunExport(run: Run) {
  const { body, betas } = buildApiRequest(run.params)
  return {
    _meta: {
      app: 'Fluffy Parrot',
      exportedAt: new Date().toISOString(),
      run: run.index,
      endpoint: 'POST https://api.anthropic.com/v1/messages',
      headers: {
        'content-type': 'application/json',
        'x-api-key': '<YOUR_ANTHROPIC_API_KEY>',
        'anthropic-version': '2023-06-01',
        ...(betas.length ? { 'anthropic-beta': betas.join(',') } : {})
      },
      note: 'Send `request` as the JSON body (add your own `messages`). `exampleInput` is the input this run used; `observed` is its measured usage/cost.'
    },
    request: body,
    exampleInput: {
      text: run.input.text,
      attachments: run.input.attachments.map(a => ({ kind: a.kind, name: a.name, mediaType: a.mediaType }))
    },
    observed: {
      usage: run.tokenUsage,
      estimatedCost: formatCost(computeCost(run))
    }
  }
}

// Trigger a browser download of the run's settings as JSON.
export function downloadRunSettings(run: Run): void {
  const json = JSON.stringify(buildRunExport(run), null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fluffy-parrot-run-${run.index}.json`
  a.click()
  URL.revokeObjectURL(url)
}
