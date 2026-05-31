import React, { useCallback } from 'react'
import { MODELS as MODEL_REGISTRY } from '../lib/models'

const MODELS = MODEL_REGISTRY.map(m => ({ id: m.id, label: m.label }))

// Detent angles (degrees from top) spread symmetrically across a 270° arc for any model count.
function detentPositions(count: number): number[] {
  if (count <= 1) return [0]
  const span = 270
  const step = span / (count - 1)
  return Array.from({ length: count }, (_, i) => -span / 2 + i * step)
}

interface ModelSelectorProps {
  value: string
  onChange: (model: string) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const currentIdx = MODELS.findIndex(m => m.id === value)

  const size = 72
  // Horizontal padding around the knob, reserving room for the labels that sit
  // beside it (e.g. "OPUS 4.7"/"OPUS 4.8") so they aren't clipped at the edge.
  const padX = 100
  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - 4
  const knobR = outerR - 10

  // Detent angles spread symmetrically across the arc, sized to the model count.
  const positions = detentPositions(MODELS.length)

  const handleClick = useCallback((e: React.MouseEvent<SVGElement>) => {
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
    const dx = e.clientX - rect.left - cx
    const dy = e.clientY - rect.top - cy
    let angle = Math.atan2(dx, -dy) * (180 / Math.PI)  // 0 = top
    // normalize to -180..180
    if (angle < -180) angle += 360
    if (angle > 180) angle -= 360

    // find nearest detent
    let closest = 0
    let minDist = Infinity
    positions.forEach((pos, i) => {
      const dist = Math.abs(pos - angle)
      if (dist < minDist) { minDist = dist; closest = i }
    })
    onChange(MODELS[closest].id)
  }, [onChange])

  function polarToXY(r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  const pointerAngle = positions[currentIdx] ?? 0
  const pointer = polarToXY(knobR - 6, pointerAngle)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: size + padX, height: size + 20 }}>
        {/* Model labels */}
        {MODELS.map((m, i) => {
          const angle = positions[i]
          const labelPos = polarToXY(outerR + 14, angle)
          const isActive = i === currentIdx
          return (
            <span
              key={m.id}
              onClick={() => onChange(m.id)}
              style={{
                position: 'absolute',
                left: labelPos.x + padX / 2,
                top: labelPos.y + 10,
                transform: 'translate(-50%, -50%)',
                whiteSpace: 'nowrap',
                textAlign: 'center',
                fontSize: 8,
                letterSpacing: '0.1em',
                color: isActive ? 'var(--accent)' : 'var(--text-dim)',
                cursor: 'pointer',
                textShadow: isActive ? '0 0 8px var(--accent-glow)' : 'none',
                transition: 'color 0.1s'
              }}
            >
              {m.label}
            </span>
          )
        })}

        <svg
          width={size}
          height={size}
          style={{ position: 'absolute', left: padX / 2, top: 10, cursor: 'pointer', overflow: 'visible' }}
          onClick={handleClick}
        >
          {/* Layer 1: detent marks only. No outer ring circle — the knob face
              sits directly on the panel for a clean, halo-free look. */}

          {/* Detent marks */}
          {positions.map((angle, i) => {
            const inner = polarToXY(outerR - 4, angle)
            const outer = polarToXY(outerR - 1, angle)
            return (
              <line
                key={i}
                x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                stroke={i === currentIdx ? 'var(--accent)' : 'var(--knob-ticks-major, #2a2a2a)'}
                strokeWidth={2}
                strokeLinecap="round"
              />
            )
          })}
        </svg>
        {/* Layer 2: knob face — HTML div so CSS gradients render */}
        <div style={{
          position: 'absolute',
          borderRadius: '50%',
          background: 'var(--knob-face)',
          border: '1px solid var(--knob-ring, #0d0d0d)',
          width: knobR * 2,
          height: knobR * 2,
          left: padX / 2 + cx - knobR,
          top: 10 + cy - knobR,
          pointerEvents: 'none',
        }} />
        {/* Layer 3: pointer + center dot */}
        <svg
          width={size}
          height={size}
          style={{ position: 'absolute', left: padX / 2, top: 10, overflow: 'visible', pointerEvents: 'none' }}
        >
          {/* Pointer */}
          <line
            x1={cx} y1={cy} x2={pointer.x} y2={pointer.y}
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <circle cx={pointer.x} cy={pointer.y} r={2} fill="var(--accent)" />
          <circle cx={cx} cy={cy} r={2} fill="var(--knob-center, #111)" />
        </svg>
      </div>

    </div>
  )
}
