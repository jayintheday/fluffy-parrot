import React, { useState, useCallback } from 'react'
import { useKnobDrag } from '../hooks/useKnobDrag'
import { DocsLabel } from './DocsLabel'

interface KnobProps {
  value: number
  min: number
  max: number
  defaultValue: number
  step?: number
  label: string
  unit?: string
  size?: number
  hot?: boolean // true when value should trigger orange "warm" color
  docsUrl?: string
  onChange: (v: number) => void
}

const START_ANGLE = -135  // degrees from top (7 o'clock position)
const END_ANGLE = 135     // degrees from top (5 o'clock position)
const TOTAL_SWEEP = END_ANGLE - START_ANGLE // 270 degrees

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function valueToAngle(value: number, min: number, max: number): number {
  const pct = (value - min) / (max - min)
  return START_ANGLE + pct * TOTAL_SWEEP
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToXY(cx, cy, r, startAngle)
  const end = polarToXY(cx, cy, r, endAngle)
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0
  const sweep = endAngle > startAngle ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`
}

export function Knob({ value, min, max, defaultValue, step, label, unit, size = 64, hot, docsUrl, onChange }: KnobProps) {
  const [editing, setEditing] = useState(false)
  const [editStr, setEditStr] = useState('')

  const { onMouseDown, onWheel } = useKnobDrag({ value, min, max, step: step ?? (max - min) / 100, onChange })

  const handleDoubleClick = useCallback(() => {
    onChange(defaultValue)
  }, [defaultValue, onChange])

  const handleLabelClick = useCallback(() => {
    setEditStr(formatValue(value, step))
    setEditing(true)
  }, [value, step])

  const handleEditSubmit = useCallback(() => {
    const parsed = parseFloat(editStr)
    if (!isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)))
    }
    setEditing(false)
  }, [editStr, min, max, onChange])

  const isHot = hot !== undefined ? hot : value > (min + (max - min) * 0.85)
  const isDefault = Math.abs(value - defaultValue) < 0.001
  const accentColor = isHot ? 'var(--accent-warm)' : 'var(--accent)'
  const glowColor = isHot ? 'var(--accent-warm-glow)' : 'var(--accent-glow)'

  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - 3
  const trackR = outerR - 8
  const knobR = trackR - 5
  const pointerR = knobR - 6

  const currentAngle = valueToAngle(value, min, max)

  // tick marks
  const tickCount = 9
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const angle = START_ANGLE + (i / (tickCount - 1)) * TOTAL_SWEEP
    const inner = polarToXY(cx, cy, outerR - 2, angle)
    const outer = polarToXY(cx, cy, outerR + 1, angle)
    const isMajor = i === 0 || i === tickCount - 1 || i === Math.floor(tickCount / 2)
    return { inner, outer, isMajor, angle }
  })

  // pointer endpoint
  const pointer = polarToXY(cx, cy, pointerR, currentAngle)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          cursor: 'ns-resize',
          filter: isDefault ? 'none' : `drop-shadow(0 0 5px ${glowColor})`
        }}
        onMouseDown={onMouseDown}
        onWheel={onWheel}
        onDoubleClick={handleDoubleClick}
        title={`${label}: ${formatValue(value, step)}${unit ? ' ' + unit : ''}\nDouble-click to reset`}
      >
        {/* Layer 1: track, ticks (no outer recess ring — keeps the knob clean
            against the panel instead of haloed by a dark circle) */}
        <svg width={size} height={size} style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0 }}>
          {/* Track background */}
          <path
            d={describeArc(cx, cy, trackR, START_ANGLE, END_ANGLE)}
            fill="none"
            stroke="var(--knob-track, #1a1a1a)"
            strokeWidth={3}
            strokeLinecap="round"
          />

          {/* Value arc */}
          {!isDefault && (
            <path
              d={describeArc(cx, cy, trackR, START_ANGLE, currentAngle)}
              fill="none"
              stroke={accentColor}
              strokeWidth={3}
              strokeLinecap="round"
            />
          )}

          {/* Tick marks */}
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.inner.x} y1={t.inner.y}
              x2={t.outer.x} y2={t.outer.y}
              stroke={t.isMajor ? 'var(--knob-ticks-major, #3a3a3a)' : 'var(--knob-ticks-minor, #222)'}
              strokeWidth={t.isMajor ? 1.5 : 1}
            />
          ))}
        </svg>
        {/* Layer 2: knob face — HTML div so CSS gradients from --knob-face render */}
        <div style={{
          position: 'absolute',
          borderRadius: '50%',
          background: 'var(--knob-face)',
          border: '1px solid var(--knob-ring, #0d0d0d)',
          width: knobR * 2,
          height: knobR * 2,
          left: cx - knobR,
          top: cy - knobR,
          pointerEvents: 'none',
        }} />
        {/* Layer 3: highlight, pointer, center dot */}
        <svg width={size} height={size} style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
          {/* Knob highlight (top-left bevel) */}
          <ellipse
            cx={cx - knobR * 0.2} cy={cy - knobR * 0.25}
            rx={knobR * 0.5} ry={knobR * 0.3}
            fill="rgba(255,255,255,0.04)"
          />

          {/* Pointer line */}
          <line
            x1={cx} y1={cy}
            x2={pointer.x} y2={pointer.y}
            stroke={accentColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={0.9}
          />
          {/* Pointer dot */}
          <circle
            cx={pointer.x} cy={pointer.y} r={2}
            fill={accentColor}
          />

          {/* Center dot */}
          <circle cx={cx} cy={cy} r={2} fill="var(--knob-center, #111)" />
        </svg>
      </div>

      {/* Value display */}
      {editing ? (
        <input
          autoFocus
          value={editStr}
          onChange={e => setEditStr(e.target.value)}
          onBlur={handleEditSubmit}
          onKeyDown={e => { if (e.key === 'Enter') handleEditSubmit(); if (e.key === 'Escape') setEditing(false) }}
          style={{
            width: 52,
            background: 'var(--bg-elevated)',
            border: `1px solid ${accentColor}`,
            color: accentColor,
            font: 'inherit',
            fontSize: 11,
            textAlign: 'center',
            outline: 'none',
            padding: '1px 2px'
          }}
        />
      ) : (
        <span
          onClick={handleLabelClick}
          style={{
            color: isDefault ? 'var(--text-dim)' : accentColor,
            fontSize: 11,
            cursor: 'text',
            letterSpacing: '0.05em',
            minWidth: 40,
            textAlign: 'center'
          }}
        >
          {formatValue(value, step)}{unit ? <span style={{ color: 'var(--text-dim)', fontSize: 9 }}> {unit}</span> : null}
        </span>
      )}

      {/* Label doubles as the docs link */}
      <DocsLabel url={docsUrl} style={{ color: 'var(--text-dim)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        {label}
      </DocsLabel>
    </div>
  )
}

function formatValue(value: number, step?: number): string {
  if (step && step >= 1) return Math.round(value).toString()
  if (step && step >= 0.1) return value.toFixed(1)
  return value.toFixed(2)
}
