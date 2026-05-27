import React from 'react'
import { diffLines, diffWords } from 'diff'
import type { Run } from '../types'
import { runText, diffParams } from '../lib/runFormat'

interface DiffViewProps {
  runs: Run[]
  aId: string | null
  bId: string | null
  onChangeA: (id: string) => void
  onChangeB: (id: string) => void
}

type CellKind = 'same' | 'del' | 'add' | 'empty'
interface Cell {
  n: number | null
  kind: CellKind
  node: React.ReactNode
}
interface Row {
  left: Cell
  right: Cell
}

function splitLines(v: string): string[] {
  const lines = v.split('\n')
  if (lines.length && lines[lines.length - 1] === '') lines.pop()
  return lines
}

// Word-level highlight for a changed line pair.
function wordDiff(a: string, b: string): [React.ReactNode, React.ReactNode] {
  const parts = diffWords(a, b)
  const left = parts
    .filter(p => !p.added)
    .map((p, i) =>
      p.removed ? (
        <span key={i} style={{ background: 'var(--diff-del-strong)' }}>
          {p.value}
        </span>
      ) : (
        <span key={i}>{p.value}</span>
      )
    )
  const right = parts
    .filter(p => !p.removed)
    .map((p, i) =>
      p.added ? (
        <span key={i} style={{ background: 'var(--diff-add-strong)' }}>
          {p.value}
        </span>
      ) : (
        <span key={i}>{p.value}</span>
      )
    )
  return [left, right]
}

function buildRows(a: string, b: string): Row[] {
  const parts = diffLines(a, b)
  const rows: Row[] = []
  let na = 1
  let nb = 1
  let i = 0
  while (i < parts.length) {
    const part = parts[i]
    const lines = splitLines(part.value)
    if (!part.added && !part.removed) {
      for (const ln of lines) {
        rows.push({ left: { n: na++, kind: 'same', node: ln }, right: { n: nb++, kind: 'same', node: ln } })
      }
      i++
    } else if (part.removed) {
      const next = parts[i + 1]
      if (next && next.added) {
        const dels = lines
        const adds = splitLines(next.value)
        const max = Math.max(dels.length, adds.length)
        for (let k = 0; k < max; k++) {
          const dl = dels[k]
          const al = adds[k]
          if (dl !== undefined && al !== undefined) {
            const [ln, rn] = wordDiff(dl, al)
            rows.push({ left: { n: na++, kind: 'del', node: ln }, right: { n: nb++, kind: 'add', node: rn } })
          } else if (dl !== undefined) {
            rows.push({ left: { n: na++, kind: 'del', node: dl }, right: { n: null, kind: 'empty', node: '' } })
          } else {
            rows.push({ left: { n: null, kind: 'empty', node: '' }, right: { n: nb++, kind: 'add', node: al } })
          }
        }
        i += 2
      } else {
        for (const ln of lines) {
          rows.push({ left: { n: na++, kind: 'del', node: ln }, right: { n: null, kind: 'empty', node: '' } })
        }
        i++
      }
    } else {
      for (const ln of lines) {
        rows.push({ left: { n: null, kind: 'empty', node: '' }, right: { n: nb++, kind: 'add', node: ln } })
      }
      i++
    }
  }
  return rows
}

const cellBg: Record<CellKind, string> = {
  same: 'transparent',
  del: 'var(--diff-del-bg)',
  add: 'var(--diff-add-bg)',
  empty: 'rgba(255,255,255,0.02)'
}
const signFor: Record<CellKind, string> = { same: ' ', del: '-', add: '+', empty: '' }

function RunPicker({
  label,
  runs,
  value,
  onChange
}: {
  label: string
  runs: Run[]
  value: string | null
  onChange: (id: string) => void
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)', fontSize: 9 }}>
      {label}
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--panel-border)',
          color: 'var(--accent)',
          font: 'inherit',
          fontSize: 10,
          padding: '2px 4px',
          outline: 'none'
        }}
      >
        {runs.map(r => (
          <option key={r.id} value={r.id}>
            RUN {r.index}
          </option>
        ))}
      </select>
    </label>
  )
}

export function DiffView({ runs, aId, bId, onChangeA, onChangeB }: DiffViewProps) {
  const runA = runs.find(r => r.id === aId) ?? null
  const runB = runs.find(r => r.id === bId) ?? null

  const header = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '6px 12px',
        borderBottom: '1px solid var(--panel-border)',
        background: 'var(--bg-panel)',
        flexShrink: 0
      }}
    >
      <span style={{ color: 'var(--text-dim)', fontSize: 8, letterSpacing: '0.2em' }}>COMPARE</span>
      <RunPicker label="A" runs={runs} value={aId} onChange={onChangeA} />
      <span style={{ color: 'var(--text-dim)' }}>→</span>
      <RunPicker label="B" runs={runs} value={bId} onChange={onChangeB} />
    </div>
  )

  if (!runA || !runB) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden', background: 'var(--bg-panel)' }}>
        {header}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-dim)',
            fontSize: 11
          }}
        >
          PICK TWO RUNS TO COMPARE
        </div>
      </div>
    )
  }

  const deltas = diffParams(runA, runB)
  const rows = buildRows(runText(runA), runText(runB))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden', background: 'var(--bg-panel)' }}>
      {header}

      {/* Settings delta */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--panel-border)',
          background: 'var(--bg-base)',
          maxHeight: 140,
          overflowY: 'auto',
          flexShrink: 0
        }}
      >
        <div style={{ color: 'var(--text-dim)', fontSize: 8, letterSpacing: '0.2em', marginBottom: 4 }}>
          WHAT CHANGED — RUN {runA.index} → RUN {runB.index}
        </div>
        {deltas.length === 0 ? (
          <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>identical settings</span>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto auto', gap: '2px 8px', fontSize: 10 }}>
            {deltas.map(d => (
              <React.Fragment key={d.label}>
                <span style={{ color: 'var(--text-mid)' }}>{d.label}</span>
                <span style={{ color: 'var(--diff-del)' }}>{d.from}</span>
                <span style={{ color: 'var(--text-dim)' }}>→</span>
                <span style={{ color: 'var(--diff-add)' }}>{d.to}</span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto 1fr',
          borderBottom: '1px solid var(--panel-border)',
          color: 'var(--text-dim)',
          fontSize: 8,
          letterSpacing: '0.15em',
          flexShrink: 0
        }}
      >
        <span style={{ gridColumn: '1 / 3', padding: '4px 8px', borderRight: '1px solid var(--panel-border)' }}>
          RUN {runA.index}
        </span>
        <span style={{ gridColumn: '3 / 5', padding: '4px 8px' }}>RUN {runB.index}</span>
      </div>

      {/* Two-column diff */}
      <div className="selectable" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr', fontSize: 12, lineHeight: 1.5 }}>
          {rows.map((row, i) => (
            <React.Fragment key={i}>
              <span
                style={{
                  textAlign: 'right',
                  padding: '0 6px',
                  color: 'var(--text-dim)',
                  background: cellBg[row.left.kind],
                  userSelect: 'none',
                  fontSize: 9
                }}
              >
                {row.left.n ?? ''}
              </span>
              <span
                style={{
                  padding: '0 6px',
                  background: cellBg[row.left.kind],
                  borderRight: '1px solid var(--panel-border)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: row.left.kind === 'del' ? 'var(--text-bright)' : 'var(--text-lcd)'
                }}
              >
                <span style={{ color: 'var(--text-dim)', userSelect: 'none' }}>{signFor[row.left.kind]} </span>
                {row.left.node}
              </span>
              <span
                style={{
                  textAlign: 'right',
                  padding: '0 6px',
                  color: 'var(--text-dim)',
                  background: cellBg[row.right.kind],
                  userSelect: 'none',
                  fontSize: 9
                }}
              >
                {row.right.n ?? ''}
              </span>
              <span
                style={{
                  padding: '0 6px',
                  background: cellBg[row.right.kind],
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: row.right.kind === 'add' ? 'var(--text-bright)' : 'var(--text-lcd)'
                }}
              >
                <span style={{ color: 'var(--text-dim)', userSelect: 'none' }}>{signFor[row.right.kind]} </span>
                {row.right.node}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
