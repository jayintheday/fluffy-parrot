import React from 'react'

interface DisplayProps {
  value: string
  onChange: (v: string) => void
}

export function Display({ value, onChange }: DisplayProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minHeight: 0,
      background: 'var(--bg-panel)'
    }}>
      <div style={{
        padding: '6px 10px',
        borderBottom: '1px solid var(--panel-border)',
        color: 'var(--text-dim)',
        fontSize: 8,
        letterSpacing: '0.2em'
      }}>
        SYS·PROMPT
      </div>

      <div style={{
        position: 'relative',
        flex: 1,
        background: 'var(--bg-display)',
        margin: 8,
        border: '1px solid #0f2020',
        boxShadow: 'inset 0 0 20px rgba(0,229,255,0.03), inset 0 2px 4px rgba(0,0,0,0.8)'
      }}>
        {/* Scanlines overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="// SYSTEM PROMPT"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: 'var(--text-lcd)',
            font: 'inherit',
            fontSize: 11,
            lineHeight: 1.6,
            padding: '8px 10px',
            caretColor: 'var(--accent)',
            zIndex: 2
          }}
          spellCheck={false}
        />
      </div>
    </div>
  )
}
