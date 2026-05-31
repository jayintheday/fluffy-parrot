import type { Run } from '../types'
import { getModel } from './models'

const WEB_SEARCH_PER_REQUEST = 0.01 // $10 / 1000 searches

// Actual dollar cost of a run from the token usage the API reported. null when price unknown.
export function computeCost(run: Run): number | null {
  const p = getModel(run.params.model)?.price
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
  // Sub-cent costs (e.g. a 2-token "hi") round away at 4dp and can look identical across
  // models — show 2 significant figures so small costs stay distinct (e.g. $0.00038 vs $0.00044).
  if (cost < 0.01) return '$' + cost.toPrecision(2)
  return '$' + cost.toFixed(4)
}
