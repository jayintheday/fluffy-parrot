import React, { useState, useCallback } from 'react'
import { Knob } from './Knob'
import { InfoLink } from './InfoLink'
import { getModel } from '../lib/models'
import type { ClaudeParams, Effort, ToolChoice } from '../types'

interface AdvancedRackProps {
  params: ClaudeParams
  onChange: (params: ClaudeParams) => void
}

const EFFORTS: Effort[] = ['off', 'low', 'medium', 'high', 'xhigh', 'max']
const TOOL_CHOICES: ToolChoice[] = ['auto', 'any', 'none']

function Toggle({ on, label, onClick, docsUrl }: { on: boolean; label: string; onClick: () => void; docsUrl?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div
        onClick={onClick}
        title={label}
        style={{
          width: 28,
          height: 16,
          border: `1px solid ${on ? 'var(--accent)' : 'var(--panel-border)'}`,
          background: on ? 'var(--accent)' : 'var(--bg-elevated)',
          cursor: 'pointer',
          position: 'relative',
          boxShadow: on ? '0 0 8px var(--accent-glow)' : 'inset 0 1px 3px rgba(0,0,0,0.5)',
          transition: 'background 0.2s cubic-bezier(0.4,0,0.2,1), border-color 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s cubic-bezier(0.4,0,0.2,1)'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: on ? 14 : 2,
            width: 10,
            height: 10,
            background: on ? '#fff' : 'var(--text-dim)',
            transition: 'left 0.2s cubic-bezier(0.4,0,0.2,1), background 0.2s cubic-bezier(0.4,0,0.2,1)'
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <span style={{ color: on ? 'var(--accent)' : 'var(--text-dim)', fontSize: 8, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
          {label}
        </span>
        {docsUrl && <InfoLink url={docsUrl} />}
      </div>
    </div>
  )
}

// Click-to-cycle stepped readout, styled like a small detent display.
function Cycle({ label, value, onClick, docsUrl }: { label: string; value: string; onClick: () => void; docsUrl?: string }) {
  const active = value !== 'off' && value !== 'auto'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div
        onClick={onClick}
        style={{
          minWidth: 52,
          textAlign: 'center',
          border: `1px solid ${active ? 'var(--accent)' : 'var(--panel-border)'}`,
          background: 'var(--bg-display)',
          color: active ? 'var(--text-lcd)' : 'var(--text-dim)',
          fontSize: 10,
          letterSpacing: '0.1em',
          padding: '3px 8px',
          cursor: 'pointer',
          boxShadow: active ? 'inset 0 0 8px rgba(0,229,255,0.08)' : 'inset 0 1px 3px rgba(0,0,0,0.5)'
        }}
      >
        {value.toUpperCase()}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <span style={{ color: 'var(--text-dim)', fontSize: 8, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{label}</span>
        {docsUrl && <InfoLink url={docsUrl} />}
      </div>
    </div>
  )
}

function TextField({
  label,
  value,
  placeholder,
  width = 120,
  docsUrl,
  onChange
}: {
  label: string
  value: string
  placeholder?: string
  width?: number
  docsUrl?: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <input
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        spellCheck={false}
        style={{
          width,
          background: 'var(--bg-display)',
          border: '1px solid var(--panel-border)',
          color: 'var(--text-lcd)',
          font: 'inherit',
          fontSize: 10,
          padding: '3px 6px',
          textAlign: 'center',
          outline: 'none',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <span style={{ color: 'var(--text-dim)', fontSize: 8, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{label}</span>
        {docsUrl && <InfoLink url={docsUrl} />}
      </div>
    </div>
  )
}

function StopSeqField({ value, onChange, docsUrl }: { value: string[]; onChange: (v: string[]) => void; docsUrl?: string }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const t = draft.trim()
    if (t && !value.includes(t)) onChange([...value, t])
    setDraft('')
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', maxWidth: 220 }}>
        {value.map(s => (
          <span
            key={s}
            onClick={() => onChange(value.filter(x => x !== s))}
            title="Click to remove"
            style={{
              fontSize: 9,
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
              padding: '2px 5px',
              cursor: 'pointer',
              letterSpacing: '0.05em'
            }}
          >
            {JSON.stringify(s).slice(1, -1)} ×
          </span>
        ))}
        <input
          value={draft}
          placeholder="add…"
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          onBlur={add}
          spellCheck={false}
          style={{
            width: 70,
            background: 'var(--bg-display)',
            border: '1px solid var(--panel-border)',
            color: 'var(--text-lcd)',
            font: 'inherit',
            fontSize: 10,
            padding: '3px 6px',
            textAlign: 'center',
            outline: 'none',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <span style={{ color: 'var(--text-dim)', fontSize: 8, letterSpacing: '0.1em' }}>STOP SEQ</span>
        {docsUrl && <InfoLink url={docsUrl} />}
      </div>
    </div>
  )
}

const divider = (
  <div
    style={{
      width: 1,
      alignSelf: 'stretch',
      margin: '4px 0',
      background: 'linear-gradient(to bottom, transparent, var(--panel-border), transparent)'
    }}
  />
)

export function AdvancedRack({ params, onChange }: AdvancedRackProps) {
  const [open, setOpen] = useState(true)

  const set = useCallback(
    <K extends keyof ClaudeParams>(key: K, value: ClaudeParams[K]) => {
      onChange({ ...params, [key]: value })
    },
    [params, onChange]
  )

  // Adaptive-only models (Opus 4.7/4.8) ignore a manual thinking budget — effort controls depth.
  const adaptive = getModel(params.model)?.thinkingMode === 'adaptive'

  // Thinking budget must stay below max_tokens (Anthropic constraint), and
  // max_tokens itself tops out at 8192 — so 32000 was never reachable. Bind the
  // knob's range to the live MAX TOKENS so its full sweep actually engages.
  const budgetMax = Math.max(1024, params.maxTokens - 1)

  const cycleEffort = () => set('effort', EFFORTS[(EFFORTS.indexOf(params.effort) + 1) % EFFORTS.length])
  const cycleToolChoice = () =>
    set('toolChoice', TOOL_CHOICES[(TOOL_CHOICES.indexOf(params.toolChoice) + 1) % TOOL_CHOICES.length])
  const setTool = (k: keyof ClaudeParams['tools']) => set('tools', { ...params.tools, [k]: !params.tools[k] })

  return (
    <div className="panel-bevel" style={{ position: 'relative', background: 'var(--bg-panel)', borderBottom: '1px solid var(--panel-border)' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 24px',
          cursor: 'pointer',
          color: 'var(--text-dim)',
          fontSize: 8,
          letterSpacing: '0.2em',
          userSelect: 'none'
        }}
      >
        <span>{open ? '▾' : '▸'}</span>
        <span>ADVANCED</span>
      </div>

      <div
          style={{
            maxHeight: open ? 150 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.38s ease',
          }}
        >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            gap: 18,
            padding: '8px 24px 16px',
            boxShadow: 'var(--panel-shadow)'
          }}
        >
          <Toggle on={params.thinkingEnabled} label="THINK" onClick={() => set('thinkingEnabled', !params.thinkingEnabled)} docsUrl="https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking" />
          {adaptive ? (
            // Budget has no effect in adaptive mode; show it dimmed and route depth control to EFFORT.
            <div
              title="Adaptive thinking — depth is controlled by EFFORT, not a token budget"
              style={{ opacity: 0.35, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
            >
              <Knob label="BUDGET" value={Math.min(params.thinkingBudget, budgetMax)} min={1024} max={budgetMax} defaultValue={1024} step={256} size={64} docsUrl="https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking" onChange={() => {}} />
              <span style={{ color: 'var(--text-dim)', fontSize: 7, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>USES EFFORT</span>
            </div>
          ) : (
            <Knob
              label="BUDGET"
              value={Math.min(params.thinkingBudget, budgetMax)}
              min={1024}
              max={budgetMax}
              defaultValue={1024}
              step={256}
              size={64}
              docsUrl="https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking"
              onChange={v => {
                const budget = Math.min(Math.round(v / 256) * 256, budgetMax)
                onChange({ ...params, thinkingBudget: budget, thinkingEnabled: budget > 1024 })
              }}
            />
          )}
          {divider}
          <Cycle label="EFFORT" value={params.effort} onClick={cycleEffort} docsUrl="https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking" />
          {divider}
          <Toggle
            on={params.serviceTier === 'standard_only'}
            label="STD TIER"
            onClick={() => set('serviceTier', params.serviceTier === 'auto' ? 'standard_only' : 'auto')}
            docsUrl="https://docs.anthropic.com/en/api/messages"
          />
          <Toggle on={params.cacheEnabled} label="CACHE" onClick={() => set('cacheEnabled', !params.cacheEnabled)} docsUrl="https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching" />
          {divider}
          <StopSeqField value={params.stopSequences} onChange={v => set('stopSequences', v)} docsUrl="https://docs.anthropic.com/en/api/messages" />
          <TextField label="USER ID" value={params.userId} placeholder="metadata" docsUrl="https://docs.anthropic.com/en/api/messages" onChange={v => set('userId', v)} />
          {divider}
          <Toggle on={params.tools.webSearch} label="WEB SRCH" onClick={() => setTool('webSearch')} docsUrl="https://docs.anthropic.com/en/docs/build-with-claude/tool-use/web-search-tool" />
          <Toggle on={params.tools.codeExec} label="CODE EXEC" onClick={() => setTool('codeExec')} docsUrl="https://docs.anthropic.com/en/docs/build-with-claude/tool-use/code-execution-tool" />
          <Toggle on={params.tools.webFetch} label="WEB FETCH" onClick={() => setTool('webFetch')} docsUrl="https://docs.anthropic.com/en/docs/build-with-claude/tool-use/web-fetch" />
          <Cycle label="TOOL CHC" value={params.toolChoice} onClick={cycleToolChoice} docsUrl="https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview" />
          {divider}
          <TextField label="CONTAINER" value={params.container} placeholder="id" width={90} docsUrl="https://docs.anthropic.com/en/docs/build-with-claude/tool-use/code-execution-tool" onChange={v => set('container', v)} />
          <TextField label="GEO" value={params.inferenceGeo} placeholder="region" width={70} docsUrl="https://docs.anthropic.com/en/api/messages" onChange={v => set('inferenceGeo', v)} />
        </div>
      </div>
    </div>
  )
}
