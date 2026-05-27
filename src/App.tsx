import React, { useState, useEffect } from 'react'
import { KnobBank } from './components/KnobBank'
import { ModelSelector } from './components/ModelSelector'
import { Display } from './components/Display'
import { ConversationView } from './components/ConversationView'
import { InputBar } from './components/InputBar'
import { LEDIndicator } from './components/LEDIndicator'
import { APIKeySetup } from './components/APIKeySetup'
import { useClaude } from './hooks/useClaude'
import type { ClaudeParams, LEDState } from './types'
import './styles/global.css'

const DEFAULT_PARAMS: ClaudeParams = {
  model: 'claude-sonnet-4-6',
  temperature: 1.0,
  topP: 1.0,
  topK: 0,
  maxTokens: 2048,
  stream: true,
  systemPrompt: ''
}

export function App() {
  const [params, setParams] = useState<ClaudeParams>(DEFAULT_PARAMS)
  const [hasKey, setHasKey] = useState<boolean | null>(null)
  const { messages, streaming, tokenUsage, sendMessage, clearMessages } = useClaude()

  useEffect(() => {
    window.electronAPI.hasKey().then(setHasKey)
  }, [])

  const handleSaveKey = async (key: string) => {
    await window.electronAPI.saveKey(key)
    setHasKey(true)
  }

  const handleSend = (text: string) => {
    sendMessage(text, params)
  }

  const ledState: LEDState = !hasKey ? 'off' : streaming ? 'amber' : 'green'

  if (hasKey === null) return null // loading

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--bg-base)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '10px 20px',
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--panel-border)',
        boxShadow: 'var(--panel-shadow)',
        WebkitAppRegion: 'drag' as never,
        flexShrink: 0
      }}>
        {/* macOS traffic lights space */}
        <div style={{ width: 60 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LEDIndicator state={ledState} pulse={streaming} />
          <span style={{
            color: 'var(--accent)',
            fontSize: 11,
            letterSpacing: '0.3em',
            fontWeight: 500
          }}>
            FLUFFY PARROT
          </span>
          <span style={{
            color: 'var(--text-dim)',
            fontSize: 8,
            letterSpacing: '0.1em'
          }}>
            v0.1
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ WebkitAppRegion: 'no-drag' as never }}>
          <ModelSelector
            value={params.model}
            onChange={model => setParams(p => ({ ...p, model }))}
          />
        </div>

        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            style={{
              WebkitAppRegion: 'no-drag' as never,
              background: 'none',
              border: '1px solid var(--panel-border)',
              color: 'var(--text-dim)',
              font: 'inherit',
              fontSize: 8,
              letterSpacing: '0.1em',
              padding: '4px 8px',
              cursor: 'pointer'
            }}
            title="Clear conversation"
          >
            CLR
          </button>
        )}
      </div>

      {/* Knob bank */}
      <div style={{ flexShrink: 0 }}>
        <KnobBank params={params} onChange={setParams} />
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        minHeight: 0
      }}>
        <Display
          value={params.systemPrompt}
          onChange={sp => setParams(p => ({ ...p, systemPrompt: sp }))}
        />
        <ConversationView
          messages={messages}
          tokenUsage={tokenUsage}
          maxTokens={params.maxTokens}
        />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0 }}>
        <InputBar disabled={streaming || !hasKey} onSubmit={handleSend} />
      </div>

      {!hasKey && <APIKeySetup onSave={handleSaveKey} />}
    </div>
  )
}
