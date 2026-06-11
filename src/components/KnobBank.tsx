import React, { useCallback } from 'react'
import { Knob } from './Knob'
import { ModelSelector } from './ModelSelector'
import { DocsLabel } from './DocsLabel'
import { docsLinks } from '../lib/docsLinks'
import { getModel } from '../lib/models'
import type { ClaudeParams } from '../types'

interface KnobBankProps {
  params: ClaudeParams
  onChange: (params: ClaudeParams) => void
}

// App logomark — knob icon in panel accent colour.
function BrandLogo() {
  return (
    <svg
      width={44} height={44}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--accent)"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ overflow: 'visible', filter: 'drop-shadow(0 0 5px var(--accent-glow))' }}
    >
      <path d="M5.6 18.4a9 9 0 1 1 12.8 0" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 12V7.8" />
      <path d="M12 1.5v1.6M22.5 12h-1.6M1.5 12h1.6M4.9 4.9l1.1 1.1M19.1 4.9l-1.1 1.1" />
    </svg>
  )
}

export function KnobBank({ params, onChange }: KnobBankProps) {
  const set = useCallback(<K extends keyof ClaudeParams>(key: K, value: ClaudeParams[K]) => {
    onChange({ ...params, [key]: value })
  }, [params, onChange])

  // Switching models also clamps maxTokens: a model with a smaller output cap
  // (e.g. Sonnet 64K) must not inherit a larger value left over from Fable/Opus (128K).
  const setModel = useCallback((model: string) => {
    const cap = getModel(model)?.maxOutput ?? 8192
    onChange({ ...params, model, maxTokens: Math.min(params.maxTokens, cap) })
  }, [params, onChange])

  // TOKENS knob ceiling is per-model (64K Haiku/Sonnet, 128K Opus/Fable).
  const tokenMax = getModel(params.model)?.maxOutput ?? 8192

  const divider = (
    <div style={{
      width: 1,
      alignSelf: 'stretch',
      margin: '8px 0',
      background: 'linear-gradient(to bottom, transparent, var(--panel-border), transparent)'
    }} />
  )

  return (
    <div className="panel-bevel" style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      padding: '16px 24px',
      background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--panel-border)',
      boxShadow: 'var(--panel-shadow)'
    }}>
      <BrandLogo />
      {divider}
      <ModelSelector
        value={params.model}
        onChange={setModel}
      />
      {divider}
      <Knob
        label="TEMP"
        value={params.temperature}
        min={0} max={1} defaultValue={1} step={0.01}
        hot={params.temperature > 0.85}
        docsUrl={docsLinks.temperature}
        onChange={v => set('temperature', Math.round(v * 100) / 100)}
      />
      {divider}
      <Knob
        label="TOP·P"
        value={params.topP}
        min={0} max={1} defaultValue={1} step={0.01}
        docsUrl={docsLinks.topP}
        onChange={v => set('topP', Math.round(v * 100) / 100)}
      />
      {divider}
      <Knob
        label="TOP·K"
        value={params.topK}
        min={0} max={500} defaultValue={0} step={1}
        unit={params.topK === 0 ? 'OFF' : undefined}
        docsUrl={docsLinks.topK}
        onChange={v => set('topK', Math.round(v))}
      />
      {divider}
      <Knob
        label="TOKENS"
        value={params.maxTokens}
        min={256} max={tokenMax} defaultValue={2048} step={64}
        unit="tok"
        hot={params.maxTokens > tokenMax * 0.85}
        docsUrl={docsLinks.maxTokens}
        onChange={v => set('maxTokens', Math.round(v / 64) * 64)}
      />
      {divider}

      {/* Stream toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div
          onClick={() => set('stream', !params.stream)}
          style={{
            width: 28,
            height: 16,
            borderRadius: 0,
            border: `1px solid ${params.stream ? 'var(--accent)' : 'var(--panel-border)'}`,
            background: params.stream ? 'var(--accent)' : 'var(--bg-elevated)',
            cursor: 'pointer',
            position: 'relative',
            boxShadow: params.stream ? '0 0 8px var(--accent-glow)' : 'inset 0 1px 3px rgba(0,0,0,0.5)',
            transition: 'background 0.2s cubic-bezier(0.4,0,0.2,1), border-color 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s cubic-bezier(0.4,0,0.2,1)'
          }}
          title="Toggle streaming"
        >
          <div style={{
            position: 'absolute',
            top: 2,
            left: params.stream ? 14 : 2,
            width: 10,
            height: 10,
            background: params.stream ? '#fff' : 'var(--text-dim)',
            transition: 'left 0.2s cubic-bezier(0.4,0,0.2,1), background 0.2s cubic-bezier(0.4,0,0.2,1)'
          }} />
        </div>
        <DocsLabel url={docsLinks.stream} style={{ color: params.stream ? 'var(--accent)' : 'var(--text-dim)', fontSize: 8, letterSpacing: '0.1em' }}>
          STREAM
        </DocsLabel>
      </div>
    </div>
  )
}
