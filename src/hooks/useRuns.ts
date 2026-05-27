import { useState, useCallback, useRef } from 'react'
import type { Run, ClaudeParams, Attachment, ContentBlock, StreamEvent } from '../types'

function uid() {
  return Math.random().toString(36).slice(2)
}

export interface RunInput {
  text: string
  attachments: Attachment[]
}

// Convert a single-shot input into API content blocks.
function inputToApiContent(input: RunInput): unknown[] {
  const content: unknown[] = []
  if (input.text) content.push({ type: 'text', text: input.text })
  for (const a of input.attachments) {
    if (a.kind === 'image') {
      content.push({ type: 'image', source: { type: 'base64', media_type: a.mediaType, data: a.data } })
    } else {
      content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: a.data } })
    }
  }
  if (content.length === 0) content.push({ type: 'text', text: '' })
  return content
}

export function useRuns() {
  const [runs, setRuns] = useState<Run[]>([])
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [streaming, setStreaming] = useState(false)
  const cleanupRef = useRef<(() => void)[]>([])
  const counterRef = useRef(0)

  const patchRun = useCallback((id: string, fn: (r: Run) => Run) => {
    setRuns(prev => prev.map(r => (r.id === id ? fn(r) : r)))
  }, [])

  const runPrompt = useCallback(
    async (systemPrompt: string, input: RunInput, params: ClaudeParams) => {
      const id = uid()
      counterRef.current += 1
      const run: Run = {
        id,
        index: counterRef.current,
        params,
        systemPrompt,
        input,
        output: [],
        tokenUsage: { input: 0, output: 0 },
        status: 'streaming',
        createdAt: Date.now()
      }
      setRuns(prev => [...prev, run])
      setActiveRunId(id)
      setStreaming(true)

      const payload = {
        model: params.model,
        temperature: params.temperature,
        topP: params.topP,
        topK: params.topK,
        maxTokens: params.maxTokens,
        stream: params.stream,
        systemPrompt,
        stopSequences: params.stopSequences,
        thinkingEnabled: params.thinkingEnabled,
        thinkingBudget: params.thinkingBudget,
        effort: params.effort,
        serviceTier: params.serviceTier,
        userId: params.userId,
        cacheEnabled: params.cacheEnabled,
        tools: params.tools,
        toolChoice: params.toolChoice,
        container: params.container,
        inferenceGeo: params.inferenceGeo,
        messages: [{ role: 'user' as const, content: inputToApiContent(input) }]
      }

      if (params.stream) {
        const unsubStream = window.electronAPI.onStreamEvent(raw => {
          const ev = raw as StreamEvent
          patchRun(id, r => {
            const output = [...r.output]
            if (ev.kind === 'block_start') {
              output[ev.index] = { type: ev.blockType, name: ev.name, text: '', input: '', result: '' }
            } else if (ev.kind === 'delta') {
              const b: ContentBlock = { ...(output[ev.index] ?? { type: 'text', text: '' }) }
              if (ev.text !== undefined) {
                if (b.type === 'tool_result') b.result = (b.result ?? '') + ev.text
                else b.text = (b.text ?? '') + ev.text
              }
              if (ev.input !== undefined) b.input = (b.input ?? '') + ev.input
              output[ev.index] = b
            }
            return { ...r, output }
          })
        })
        const unsubDone = window.electronAPI.onDone(usage => {
          patchRun(id, r => ({
            ...r,
            status: 'done',
            tokenUsage: { input: usage.inputTokens, output: usage.outputTokens }
          }))
          setStreaming(false)
          unsubStream()
          unsubDone()
        })
        cleanupRef.current = [unsubStream, unsubDone]

        try {
          await window.electronAPI.sendMessage(payload)
        } catch (e) {
          patchRun(id, r => ({ ...r, status: 'error', output: [{ type: 'text', text: `ERROR: ${String(e)}` }] }))
          setStreaming(false)
          unsubStream()
          unsubDone()
        }
      } else {
        try {
          const result = await window.electronAPI.sendMessage(payload)
          if (result) {
            patchRun(id, r => ({
              ...r,
              status: 'done',
              output: result.blocks,
              tokenUsage: { input: result.inputTokens, output: result.outputTokens }
            }))
          }
        } catch (e) {
          patchRun(id, r => ({ ...r, status: 'error', output: [{ type: 'text', text: `ERROR: ${String(e)}` }] }))
        }
        setStreaming(false)
      }
    },
    [patchRun]
  )

  const selectRun = useCallback((id: string) => setActiveRunId(id), [])

  const deleteRun = useCallback(
    (id: string) => {
      setRuns(prev => prev.filter(r => r.id !== id))
      setActiveRunId(prev => {
        if (prev !== id) return prev
        const remaining = runs.filter(r => r.id !== id)
        return remaining.length ? remaining[remaining.length - 1].id : null
      })
    },
    [runs]
  )

  const clearRuns = useCallback(() => {
    setRuns([])
    setActiveRunId(null)
    counterRef.current = 0
  }, [])

  return { runs, activeRunId, streaming, runPrompt, selectRun, deleteRun, clearRuns }
}
