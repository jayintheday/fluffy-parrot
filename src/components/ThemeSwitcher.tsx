import React, { useEffect, useState } from 'react'

type Theme = 'default' | 'titanium' | 'cold-steel' | 'gunmetal'

const THEMES: { id: Theme; label: string; swatch: string }[] = [
  { id: 'default',    label: 'FLAT',     swatch: '#0a0a0a' },
  { id: 'titanium',   label: 'TITAN',    swatch: 'linear-gradient(135deg, #181815 0%, #0a0a09 100%)' },
  { id: 'cold-steel', label: 'STEEL',    swatch: 'linear-gradient(135deg, #14161c 0%, #07080b 100%)' },
  { id: 'gunmetal',   label: 'GUNMTL',   swatch: 'linear-gradient(135deg, #1a1714 0%, #090807 100%)' },
]

const STORAGE_KEY = 'fp-theme'

export function ThemeSwitcher() {
  const [active, setActive] = useState<Theme>(() => {
    return (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'default'
  })

  useEffect(() => {
    const html = document.documentElement
    if (active === 'default') {
      html.removeAttribute('data-theme')
    } else {
      html.setAttribute('data-theme', active)
    }
    localStorage.setItem(STORAGE_KEY, active)
  }, [active])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        WebkitAppRegion: 'no-drag' as never,
      }}
    >
      <span style={{ color: '#333', fontSize: 8, letterSpacing: '0.15em', marginRight: 2 }}>
        BG
      </span>
      {THEMES.map(t => (
        <button
          key={t.id}
          onClick={() => setActive(t.id)}
          title={t.id === 'default' ? 'Default (flat black)' : t.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: active === t.id
              ? '1px solid var(--accent)'
              : '1px solid #2a2a2a',
            borderRadius: 2,
            padding: '3px 6px',
            cursor: 'pointer',
            color: active === t.id ? 'var(--accent)' : '#555',
            font: 'inherit',
            fontSize: 7,
            letterSpacing: '0.12em',
            transition: 'border-color 0.15s, color 0.15s',
            boxShadow: active === t.id ? '0 0 6px var(--accent-glow)' : 'none',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: t.swatch,
              border: '1px solid #333',
              flexShrink: 0,
            }}
          />
          {t.label}
        </button>
      ))}
    </div>
  )
}
