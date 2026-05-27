import React, { useCallback } from 'react'

const MODELS = [
  { id: 'claude-haiku-4-5-20251001', label: 'HAIKU' },
  { id: 'claude-sonnet-4-6',         label: 'SONNET' },
  { id: 'claude-opus-4-7',           label: 'OPUS' }
]

interface ModelSelectorProps {
  value: string
  onChange: (model: string) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const currentIdx = MODELS.findIndex(m => m.id === value)

  const size = 72
  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - 4
  const knobR = outerR - 10

  // Position labels at -120, 0, +120 degrees from top
  const positions = [-120, 0, 120]

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
      <div style={{ position: 'relative', width: size + 60, height: size + 20 }}>
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
                left: labelPos.x + (size + 60) / 2 - size / 2,
                top: labelPos.y + 10,
                transform: 'translate(-50%, -50%)',
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
          style={{ position: 'absolute', left: (60) / 2, top: 10, cursor: 'pointer', overflow: 'visible' }}
          onClick={handleClick}
        >
          {/* Outer ring */}
          <circle cx={cx} cy={cy} r={outerR} fill="#0d0d0d" stroke="#1a1a1a" strokeWidth={1.5} />

          {/* Detent marks */}
          {positions.map((angle, i) => {
            const inner = polarToXY(outerR - 4, angle)
            const outer = polarToXY(outerR - 1, angle)
            return (
              <line
                key={i}
                x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                stroke={i === currentIdx ? 'var(--accent)' : '#2a2a2a'}
                strokeWidth={2}
                strokeLinecap="round"
              />
            )
          })}

          {/* Knob face */}
          <circle cx={cx} cy={cy} r={knobR} fill="var(--knob-face)" stroke="#101010" strokeWidth={1} />

          {/* Pointer */}
          <line
            x1={cx} y1={cy} x2={pointer.x} y2={pointer.y}
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <circle cx={pointer.x} cy={pointer.y} r={2} fill="var(--accent)" />
          <circle cx={cx} cy={cy} r={2} fill="#111" />
        </svg>
      </div>

      <span style={{ color: 'var(--text-dim)', fontSize: 9, letterSpacing: '0.15em' }}>MODEL</span>
    </div>
  )
}
