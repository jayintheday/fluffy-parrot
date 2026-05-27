import type { Run } from '../types'

// USD per million tokens. Source: platform.claude.com/docs/en/about-claude/pricing
interface ModelPrice {
  input: number
  output: number
  cacheWrite5m: number
  cacheRead: number
}

const PRICES: Record<string, ModelPrice> = {
  'claude-opus-4-7': { input: 5, output: 25, cacheWrite5m: 6.25, cacheRead: 0.5 },
  'claude-sonnet-4-6': { input: 3, output: 15, cacheWrite5m: 3.75, cacheRead: 0.3 },
  'claude-haiku-4-5-20251001': { input: 1, output: 5, cacheWrite5m: 1.25, cacheRead: 0.1 }
}

const WEB_SEARCH_PER_REQUEST = 0.01 // $10 / 1000 searches

// Actual dollar cost of a run from the token usage the API reported. null when price unknown.
export function computeCost(run: Run): number | null {
  const p = PRICES[run.params.model]
  if (!p) return null
  const u = run.tokenUsage
  const per = (tokens: number, price: number) => (tokens / 1e6) * price

  let tokenCost =
    per(u.input, p.input) +
    per(u.output, p.output) +
    per(u.cacheWrite ?? 0, p.cacheWrite5m) +
    per(u.cacheRead ?? 0, p.cacheRead)

  if (run.params.inferenceGeo.trim().toLowerCase() === 'us') tokenCost *= 1.1

  return tokenCost + (u.webSearches ?? 0) * WEB_SEARCH_PER_REQUEST
}

export function formatCost(cost: number | null): string {
  if (cost === null) return 'n/a'
  if (cost === 0) return '$0'
  if (cost < 0.0001) return '<$0.0001'
  return '$' + cost.toFixed(4)
}
