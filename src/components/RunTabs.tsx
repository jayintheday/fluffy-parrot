import React from 'react'
import type { Run, RunStatus } from '../types'
import { computeCost, formatCost } from '../lib/pricing'

interface RunTabsProps {
  runs: Run[]
  activeRunId: string | null
  comparing: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onLoad: (id: string) => void
  onToggleCompare: () => void
}

const STATUS_COLOR: Record<RunStatus, string> = {
  streaming: 'var(--led-amber)',
  done: 'var(--led-green)',
  error: 'var(--led-red)'
}

export function RunTabs({ runs, activeRunId, comparing, onSelect, onDelete, onLoad, onToggleCompare }: RunTabsProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--panel-border)',
        boxShadow: 'var(--panel-shadow)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 2, overflowX: 'auto', flex: 1, padding: '4px 6px' }}>
        {runs.length === 0 && (
          <span style={{ color: 'var(--text-dim)', fontSize: 9, letterSpacing: '0.15em', padding: '6px 8px' }}>
            NO RUNS YET
          </span>
        )}
        {runs.map(run => {
          const active = !comparing && run.id === activeRunId
          return (
            <div
              key={run.id}
              onClick={() => onSelect(run.id)}
              title={`RUN ${run.index}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--panel-border)'}`,
                background: active ? 'var(--bg-elevated)' : 'transparent',
                boxShadow: active ? '0 0 8px var(--accent-glow)' : 'none'
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: STATUS_COLOR[run.status],
                  boxShadow: `0 0 4px ${STATUS_COLOR[run.status]}`
                }}
              />
              <span style={{ color: active ? 'var(--accent)' : 'var(--text-mid)', fontSize: 9, letterSpacing: '0.1em' }}>
                RUN {run.index}
              </span>
              {run.status === 'done' && (
                <span style={{ color: 'var(--text-dim)', fontSize: 8 }}>{formatCost(computeCost(run))}</span>
              )}
              <span
                onClick={e => {
                  e.stopPropagation()
                  onLoad(run.id)
                }}
                title="Load settings into composer"
                style={{ color: 'var(--text-dim)', fontSize: 10, cursor: 'pointer' }}
              >
                ↺
              </span>
              <span
                onClick={e => {
                  e.stopPropagation()
                  onDelete(run.id)
                }}
                title="Delete run"
                style={{ color: 'var(--text-dim)', fontSize: 10, cursor: 'pointer' }}
              >
                ×
              </span>
            </div>
          )
        })}
      </div>

      <button
        onClick={onToggleCompare}
        disabled={runs.length < 2}
        title={runs.length < 2 ? 'Need at least 2 runs to compare' : 'Compare two runs'}
        style={{
          alignSelf: 'stretch',
          margin: 4,
          padding: '0 14px',
          background: comparing ? 'var(--accent)' : 'var(--bg-elevated)',
          border: `1px solid ${comparing ? 'var(--accent)' : 'var(--panel-border)'}`,
          color: comparing ? '#000' : runs.length < 2 ? 'var(--text-dim)' : 'var(--accent)',
          font: 'inherit',
          fontSize: 9,
          letterSpacing: '0.15em',
          cursor: runs.length < 2 ? 'not-allowed' : 'pointer',
          boxShadow: comparing ? '0 0 8px var(--accent-glow)' : 'none'
        }}
      >
        COMPARE
      </button>
    </div>
  )
}
