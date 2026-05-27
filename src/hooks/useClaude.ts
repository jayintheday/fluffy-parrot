import { useState, useCallback, useRef } from 'react'
import type { Message, TokenUsage, ClaudeParams } from '../types'

function uid() {
  return Math.random().toString(36).slice(2)
}

export function useClaude() {
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({ input: 0, output: 0 })
  const cleanupRef = useRef<(() => void)[]>([])

  const sendMessage = useCallback(async (text: string, params: ClaudeParams) => {
    const userMsg: Message = { id: uid(), role: 'user', content: text }
    const asstId = uid()
    const asstMsg: Message = { id: asstId, role: 'assistant', content: '', streaming: true }

    setMessages(prev => [...prev, userMsg, asstMsg])
    setStreaming(true)

    const apiMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))

    if (params.stream) {
      const unsubChunk = window.electronAPI.onChunk((delta) => {
        setMessages(prev => prev.map(m =>
          m.id === asstId ? { ...m, content: m.content + delta } : m
        ))
      })
      const unsubDone = window.electronAPI.onDone((usage) => {
        setMessages(prev => prev.map(m =>
          m.id === asstId ? { ...m, streaming: false } : m
        ))
        setTokenUsage({ input: usage.inputTokens, output: usage.outputTokens })
        setStreaming(false)
        unsubChunk()
        unsubDone()
      })
      cleanupRef.current = [unsubChunk, unsubDone]

      try {
        await window.electronAPI.sendMessage({
          model: params.model,
          temperature: params.temperature,
          topP: params.topP,
          topK: params.topK,
          maxTokens: params.maxTokens,
          stream: true,
          systemPrompt: params.systemPrompt,
          messages: apiMessages
        })
      } catch (e) {
        setMessages(prev => prev.map(m =>
          m.id === asstId ? { ...m, content: `ERROR: ${String(e)}`, streaming: false } : m
        ))
        setStreaming(false)
        unsubChunk()
        unsubDone()
      }
    } else {
      try {
        const result = await window.electronAPI.sendMessage({
          model: params.model,
          temperature: params.temperature,
          topP: params.topP,
          topK: params.topK,
          maxTokens: params.maxTokens,
          stream: false,
          systemPrompt: params.systemPrompt,
          messages: apiMessages
        })
        if (result) {
          setMessages(prev => prev.map(m =>
            m.id === asstId ? { ...m, content: result.text, streaming: false } : m
          ))
          setTokenUsage({ input: result.inputTokens, output: result.outputTokens })
        }
      } catch (e) {
        setMessages(prev => prev.map(m =>
          m.id === asstId ? { ...m, content: `ERROR: ${String(e)}`, streaming: false } : m
        ))
      }
      setStreaming(false)
    }
  }, [messages])

  const clearMessages = useCallback(() => {
    setMessages([])
    setTokenUsage({ input: 0, output: 0 })
  }, [])

  return { messages, streaming, tokenUsage, sendMessage, clearMessages }
}
