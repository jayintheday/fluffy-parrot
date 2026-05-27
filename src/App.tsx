import React, { useState, useEffect, useCallback } from 'react'
import { KnobBank } from './components/KnobBank'
import { AdvancedRack } from './components/AdvancedRack'
import { Display } from './components/Display'
import { ContextUpload } from './components/ContextUpload'
import { RunTabs } from './components/RunTabs'
import { RunOutput } from './components/RunOutput'
import { DiffView } from './components/DiffView'
import { InputBar } from './components/InputBar'
import { LEDIndicator } from './components/LEDIndicator'
import { APIKeySetup } from './components/APIKeySetup'
import { ThemeSwitcher } from './components/ThemeSwitcher'
import { useRuns } from './hooks/useRuns'
import { computeCost, formatCost } from './lib/pricing'
import type { Attachment, ClaudeParams, LEDState } from './types'
import './styles/global.css'

const DEFAULT_PARAMS: ClaudeParams = {
  model: 'claude-sonnet-4-6',
  temperature: 1.0,
  topP: 1.0,
  topK: 0,
  maxTokens: 2048,
  stream: true,
  systemPrompt: '',
  stopSequences: [],
  thinkingEnabled: false,
  thinkingBudget: 1024,
  effort: 'off',
  serviceTier: 'auto',
  userId: '',
  cacheEnabled: false,
  tools: { webSearch: false, codeExec: false, webFetch: false },
  toolChoice: 'auto',
  container: '',
  inferenceGeo: ''
}

export function App() {
  const [params, setParams] = useState<ClaudeParams>(DEFAULT_PARAMS)
  const [inputText, setInputText] = useState('')
  const [inputAttachments, setInputAttachments] = useState<Attachment[]>([])
  const [contextFiles, setContextFiles] = useState<Attachment[]>([])
  const [hasKey, setHasKey] = useState<boolean | null>(null)

  const handleAddContext = (a: Attachment) =>
    setContextFiles(prev => prev.some(f => f.name === a.name) ? prev : [...prev, a])
  const handleRemoveContext = (name: string) =>
    setContextFiles(prev => prev.filter(f => f.name !== name))

  const { runs, activeRunId, streaming, runPrompt, selectRun, deleteRun, clearRuns } = useRuns()

  const [comparing, setComparing] = useState(false)
  const [compareA, setCompareA] = useState<string | null>(null)
  const [compareB, setCompareB] = useState<string | null>(null)

  useEffect(() => {
    window.electronAPI.hasKey().then(setHasKey)
  }, [])

  // Keep the compare selections valid; exit compare if fewer than 2 runs remain.
  useEffect(() => {
    if (!comparing) return
    if (runs.length < 2) {
      setComparing(false)
      return
    }
    setCompareA(a => (runs.some(r => r.id === a) ? a : runs[runs.length - 2].id))
    setCompareB(b => (runs.some(r => r.id === b) ? b : runs[runs.length - 1].id))
  }, [comparing, runs])

  const handleSaveKey = async (key: string) => {
    await window.electronAPI.saveKey(key)
    setHasKey(true)
  }

  const handleRun = () => {
    setComparing(false)
    runPrompt(params.systemPrompt, { text: inputText.trim(), attachments: inputAttachments }, params, contextFiles)
  }

  const toggleCompare = useCallback(() => {
    setComparing(c => {
      const next = !c
      if (next && runs.length >= 2) {
        setCompareA(runs[runs.length - 2].id)
        setCompareB(runs[runs.length - 1].id)
      }
      return next
    })
  }, [runs])

  const loadIntoComposer = useCallback(
    (id: string) => {
      const run = runs.find(r => r.id === id)
      if (!run) return
      setParams(run.params)
      setInputText(run.input.text)
      setInputAttachments(run.input.attachments)
      setComparing(false)
      selectRun(id)
    },
    [runs, selectRun]
  )

  const ledState: LEDState = !hasKey ? 'off' : streaming ? 'amber' : 'green'
  const activeRun = runs.find(r => r.id === activeRunId) ?? null
  const sessionTotal = runs.reduce((sum, r) => sum + (computeCost(r) ?? 0), 0)

  if (hasKey === null) return null // loading

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)' }}>
      <div className="vignette-overlay" />
      {/* Header */}
      <div
        className="panel-bevel"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '10px 20px',
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--panel-border)',
          boxShadow: 'var(--panel-shadow)',
          WebkitAppRegion: 'drag' as never,
          flexShrink: 0
        }}
      >
        {/* macOS traffic lights space */}
        <div style={{ width: 60 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LEDIndicator state={ledState} pulse={streaming} />
          <span style={{ color: 'var(--accent)', fontSize: 11, letterSpacing: '0.3em', fontWeight: 500 }}>
            FLUFFY PARROT
          </span>
          <span style={{ color: 'var(--text-dim)', fontSize: 8, letterSpacing: '0.1em' }}>v0.1</span>
        </div>

        <div style={{ flex: 1 }} />

        <ThemeSwitcher />

        {runs.length > 0 && (
          <span style={{ color: 'var(--accent)', fontSize: 9, letterSpacing: '0.1em' }} title="Total cost this session">
            Σ {formatCost(sessionTotal)}
          </span>
        )}

        {runs.length > 0 && (
          <button
            onClick={clearRuns}
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
            title="Clear all runs"
          >
            CLR ALL
          </button>
        )}
      </div>

      {/* Knob bank */}
      <div style={{ flexShrink: 0 }}>
        <KnobBank params={params} onChange={setParams} />
        <AdvancedRack params={params} onChange={setParams} />
      </div>

      {/* Run tabs */}
      {runs.length > 0 && (
        <div style={{ flexShrink: 0 }}>
          <RunTabs
            runs={runs}
            activeRunId={activeRunId}
            comparing={comparing}
            onSelect={selectRun}
            onDelete={deleteRun}
            onLoad={loadIntoComposer}
            onToggleCompare={toggleCompare}
          />
        </div>
      )}

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gridTemplateRows: 'minmax(0, 1fr)',
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: 'var(--bg-panel)',
          borderRight: '1px solid var(--panel-border)',
          overflow: 'hidden'
        }}>
          <Display value={params.systemPrompt} onChange={sp => setParams(p => ({ ...p, systemPrompt: sp }))} />
          <ContextUpload files={contextFiles} onAdd={handleAddContext} onRemove={handleRemoveContext} />
        </div>
        {comparing ? (
          <DiffView runs={runs} aId={compareA} bId={compareB} onChangeA={setCompareA} onChangeB={setCompareB} />
        ) : (
          <RunOutput run={activeRun} />
        )}
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0 }}>
        <InputBar
          disabled={streaming || !hasKey}
          value={inputText}
          attachments={inputAttachments}
          onChange={setInputText}
          onAttachmentsChange={setInputAttachments}
          onSubmit={handleRun}
        />
      </div>

      {!hasKey && <APIKeySetup onSave={handleSaveKey} />}
    </div>
  )
}
