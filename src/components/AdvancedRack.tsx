import React, { useState, useCallback } from 'react'
import { Knob } from './Knob'
import type { ClaudeParams, Effort, ToolChoice } from '../types'

interface AdvancedRackProps {
  params: ClaudeParams
  onChange: (params: ClaudeParams) => void
}

const EFFORTS: Effort[] = ['off', 'low', 'medium', 'high', 'xhigh', 'max']
const TOOL_CHOICES: ToolChoice[] = ['auto', 'any', 'none']

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
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
          transition: 'all 0.1s'
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
            transition: 'left 0.1s'
          }}
        />
      </div>
      <span style={{ color: on ? 'var(--accent)' : 'var(--text-dim)', fontSize: 8, letterSpacing: '0.1em', whiteSpace: 'nowrap', textAlign: 'center' }}>
        {label}
      </span>
    </div>
  )
}

// Click-to-cycle stepped readout, styled like a small detent display.
function Cycle({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
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
      <span style={{ color: 'var(--text-dim)', fontSize: 8, letterSpacing: '0.1em', whiteSpace: 'nowrap', textAlign: 'center' }}>{label}</span>
    </div>
  )
}

function TextField({
  label,
  value,
  placeholder,
  width = 120,
  onChange
}: {
  label: string
  value: string
  placeholder?: string
  width?: number
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
      <span style={{ color: 'var(--text-dim)', fontSize: 8, letterSpacing: '0.1em', whiteSpace: 'nowrap', textAlign: 'center' }}>{label}</span>
    </div>
  )
}

function StopSeqField({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
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
      <span style={{ color: 'var(--text-dim)', fontSize: 8, letterSpacing: '0.1em' }}>STOP SEQ</span>
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
  const [open, setOpen] = useState(false)

  const set = useCallback(
    <K extends keyof ClaudeParams>(key: K, value: ClaudeParams[K]) => {
      onChange({ ...params, [key]: value })
    },
    [params, onChange]
  )

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
            maxHeight: open ? 120 : 0,
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
          <Toggle on={params.thinkingEnabled} label="THINK" onClick={() => set('thinkingEnabled', !params.thinkingEnabled)} />
          <Knob
            label="BUDGET"
            value={params.thinkingBudget}
            min={1024}
            max={32000}
            defaultValue={1024}
            step={256}
            size={52}
            onChange={v => {
              const budget = Math.min(Math.round(v / 256) * 256, params.maxTokens - 1)
              onChange({ ...params, thinkingBudget: budget, thinkingEnabled: budget > 1024 })
            }}
          />
          {divider}
          <Cycle label="EFFORT" value={params.effort} onClick={cycleEffort} />
          {divider}
          <Toggle
            on={params.serviceTier === 'standard_only'}
            label="STD TIER"
            onClick={() => set('serviceTier', params.serviceTier === 'auto' ? 'standard_only' : 'auto')}
          />
          <Toggle on={params.cacheEnabled} label="CACHE" onClick={() => set('cacheEnabled', !params.cacheEnabled)} />
          {divider}
          <StopSeqField value={params.stopSequences} onChange={v => set('stopSequences', v)} />
          <TextField label="USER ID" value={params.userId} placeholder="metadata" onChange={v => set('userId', v)} />
          {divider}
          <Toggle on={params.tools.webSearch} label="WEB SRCH" onClick={() => setTool('webSearch')} />
          <Toggle on={params.tools.codeExec} label="CODE EXEC" onClick={() => setTool('codeExec')} />
          <Toggle on={params.tools.webFetch} label="WEB FETCH" onClick={() => setTool('webFetch')} />
          <Cycle label="TOOL CHC" value={params.toolChoice} onClick={cycleToolChoice} />
          {divider}
          <TextField label="CONTAINER" value={params.container} placeholder="id" width={90} onChange={v => set('container', v)} />
          <TextField label="GEO" value={params.inferenceGeo} placeholder="region" width={70} onChange={v => set('inferenceGeo', v)} />
        </div>
      </div>
    </div>
  )
}
