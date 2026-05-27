import { useState, useCallback, useRef } from 'react'
import type { Message, TokenUsage, ClaudeParams, Attachment, ContentBlock, StreamEvent } from '../types'

function uid() {
  return Math.random().toString(36).slice(2)
}

function textOf(m: Message): string {
  return m.blocks.filter(b => b.type === 'text').map(b => b.text ?? '').join('')
}

// Convert a renderer Message into API content blocks.
function toApiContent(m: Message): unknown[] {
  if (m.role === 'user') {
    const content: unknown[] = []
    const text = textOf(m)
    if (text) content.push({ type: 'text', text })
    for (const a of m.attachments ?? []) {
      if (a.kind === 'image') {
        content.push({ type: 'image', source: { type: 'base64', media_type: a.mediaType, data: a.data } })
      } else {
        content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: a.data } })
      }
    }
    if (content.length === 0) content.push({ type: 'text', text: '' })
    return content
  }
  // Assistant history collapses to plain text (drop prior thinking/tool blocks).
  return [{ type: 'text', text: textOf(m) || ' ' }]
}

export function useClaude() {
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({ input: 0, output: 0 })
  const cleanupRef = useRef<(() => void)[]>([])

  const sendMessage = useCallback(
    async (text: string, attachments: Attachment[], params: ClaudeParams) => {
      const userMsg: Message = {
        id: uid(),
        role: 'user',
        blocks: text ? [{ type: 'text', text }] : [],
        attachments: attachments.length ? attachments : undefined
      }
      const asstId = uid()
      const asstMsg: Message = { id: asstId, role: 'assistant', blocks: [], streaming: true }

      setMessages(prev => [...prev, userMsg, asstMsg])
      setStreaming(true)

      const apiMessages = [...messages, userMsg].map(m => ({ role: m.role, content: toApiContent(m) }))

      const requestPayload = {
        model: params.model,
        temperature: params.temperature,
        topP: params.topP,
        topK: params.topK,
        maxTokens: params.maxTokens,
        stream: params.stream,
        systemPrompt: params.systemPrompt,
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
        messages: apiMessages
      }

      if (params.stream) {
        const unsubStream = window.electronAPI.onStreamEvent(raw => {
          const ev = raw as StreamEvent
          setMessages(prev =>
            prev.map(m => {
              if (m.id !== asstId) return m
              const blocks = [...m.blocks]
              if (ev.kind === 'block_start') {
                blocks[ev.index] = { type: ev.blockType, name: ev.name, text: '', input: '', result: '' }
              } else if (ev.kind === 'delta') {
                const b: ContentBlock = { ...(blocks[ev.index] ?? { type: 'text', text: '' }) }
                if (ev.text !== undefined) {
                  if (b.type === 'tool_result') b.result = (b.result ?? '') + ev.text
                  else b.text = (b.text ?? '') + ev.text
                }
                if (ev.input !== undefined) b.input = (b.input ?? '') + ev.input
                blocks[ev.index] = b
              }
              return { ...m, blocks }
            })
          )
        })
        const unsubDone = window.electronAPI.onDone(usage => {
          setMessages(prev => prev.map(m => (m.id === asstId ? { ...m, streaming: false } : m)))
          setTokenUsage({ input: usage.inputTokens, output: usage.outputTokens })
          setStreaming(false)
          unsubStream()
          unsubDone()
        })
        cleanupRef.current = [unsubStream, unsubDone]

        try {
          await window.electronAPI.sendMessage(requestPayload)
        } catch (e) {
          setMessages(prev =>
            prev.map(m =>
              m.id === asstId ? { ...m, blocks: [{ type: 'text', text: `ERROR: ${String(e)}` }], streaming: false } : m
            )
          )
          setStreaming(false)
          unsubStream()
          unsubDone()
        }
      } else {
        try {
          const result = await window.electronAPI.sendMessage(requestPayload)
          if (result) {
            setMessages(prev =>
              prev.map(m => (m.id === asstId ? { ...m, blocks: result.blocks, streaming: false } : m))
            )
            setTokenUsage({ input: result.inputTokens, output: result.outputTokens })
          }
        } catch (e) {
          setMessages(prev =>
            prev.map(m =>
              m.id === asstId ? { ...m, blocks: [{ type: 'text', text: `ERROR: ${String(e)}` }], streaming: false } : m
            )
          )
        }
        setStreaming(false)
      }
    },
    [messages]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setTokenUsage({ input: 0, output: 0 })
  }, [])

  return { messages, streaming, tokenUsage, sendMessage, clearMessages }
}
