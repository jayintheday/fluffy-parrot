import React, { useState } from 'react'

// Renders a control's label text as the docs affordance: nothing extra at rest,
// a dotted underline + cursor:help + tooltip on hover. Falls back to a plain
// span when no url is given, so a label without docs renders identically.
export function DocsLabel({
  url,
  style,
  children
}: {
  url?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  const [hover, setHover] = useState(false)
  if (!url) return <span style={style}>{children}</span>
  return (
    <button
      onClick={e => { e.stopPropagation(); window.electronAPI.openExternal(url) }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="View API docs"
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        font: 'inherit',
        cursor: 'help',
        textDecoration: hover ? 'underline dotted' : 'none',
        textUnderlineOffset: 3,
        ...style // control-specific color/fontSize/letterSpacing
      }}
    >
      {children}
    </button>
  )
}
