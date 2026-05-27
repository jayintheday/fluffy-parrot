import React from 'react'
import type { LEDState } from '../types'

interface LEDIndicatorProps {
  state: LEDState
  label?: string
  pulse?: boolean
}

const LED_COLORS: Record<LEDState, { color: string; glow: string }> = {
  off:   { color: '#1a1a1a', glow: 'none' },
  green: { color: 'var(--led-green)',  glow: '0 0 6px 2px var(--led-green-glow)' },
  amber: { color: 'var(--led-amber)',  glow: '0 0 6px 2px var(--led-amber-glow)' },
  red:   { color: 'var(--led-red)',    glow: '0 0 6px 2px var(--led-red-glow)' }
}

export function LEDIndicator({ state, label, pulse }: LEDIndicatorProps) {
  const { color, glow } = LED_COLORS[state]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          boxShadow: glow,
          animation: pulse && state !== 'off' ? 'ledPulse 0.8s ease-in-out infinite' : 'none'
        }}
      />
      {label && (
        <span style={{ color: 'var(--text-dim)', fontSize: 8, letterSpacing: '0.1em' }}>
          {label}
        </span>
      )}
      <style>{`
        @keyframes ledPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
