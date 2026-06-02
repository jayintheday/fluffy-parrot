// Canonical Anthropic/Claude API docs links for each surface control.
// Centralized here so a future docs move is a one-file change.
// Host: docs migrated from docs.anthropic.com -> platform.claude.com/docs/en.
const BASE = 'https://platform.claude.com/docs/en'

export const docsLinks = {
  // Sampling / core request params — documented on the Messages reference.
  // No dedicated per-parameter page exists, and the reference's body anchors are
  // virtualized (a #temperature hash won't reliably scroll), so link page-level.
  temperature: `${BASE}/api/messages`,
  topP: `${BASE}/api/messages`,
  topK: `${BASE}/api/messages`,
  maxTokens: `${BASE}/api/messages`,
  stopSequences: `${BASE}/api/messages`,
  inferenceGeo: `${BASE}/api/messages`, // inference_geo: not a documented param, no dedicated doc

  // Targeted pages
  stream: `${BASE}/build-with-claude/streaming`,
  model: `${BASE}/about-claude/models/overview`,
  thinking: `${BASE}/build-with-claude/extended-thinking`, // THINK, BUDGET, EFFORT
  serviceTier: `${BASE}/api/service-tiers`,
  cache: `${BASE}/build-with-claude/prompt-caching`,
  userId: `${BASE}/api/messages#metadata`, // metadata.user_id — anchor resolves

  // Tools — note the agents-and-tools/ prefix (the old build-with-claude/ paths 404).
  webSearch: `${BASE}/agents-and-tools/tool-use/web-search-tool`,
  codeExec: `${BASE}/agents-and-tools/tool-use/code-execution-tool`,
  webFetch: `${BASE}/agents-and-tools/tool-use/web-fetch-tool`,
  toolChoice: `${BASE}/agents-and-tools/tool-use/overview`,
  container: `${BASE}/agents-and-tools/tool-use/code-execution-tool`,
} as const
