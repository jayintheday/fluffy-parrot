import React from 'react'
import type { ContentBlock, Attachment } from '../types'

export function AttachmentChips({ attachments }: { attachments: Attachment[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {attachments.map((a, i) =>
        a.kind === 'image' ? (
          <img
            key={i}
            src={`data:${a.mediaType};base64,${a.data}`}
            alt={a.name}
            style={{ width: 48, height: 48, objectFit: 'cover', border: '1px solid var(--panel-border)' }}
          />
        ) : (
          <span
            key={i}
            style={{
              fontSize: 9,
              color: 'var(--text-dim)',
              border: '1px solid var(--panel-border)',
              padding: '3px 6px',
              letterSpacing: '0.05em'
            }}
          >
            PDF · {a.name}
          </span>
        )
      )}
    </div>
  )
}

export function BlockView({ block, showCursor }: { block: ContentBlock; showCursor: boolean }) {
  const cursor = showCursor ? (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 13,
        background: 'var(--accent)',
        marginLeft: 2,
        verticalAlign: 'text-bottom',
        animation: 'blink 0.7s step-end infinite'
      }}
    />
  ) : null

  if (block.type === 'thinking') {
    return (
      <div
        style={{
          borderLeft: '2px solid var(--panel-border)',
          paddingLeft: 8,
          margin: '2px 0',
          color: 'var(--text-dim)',
          fontStyle: 'italic',
          fontSize: 11,
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        <span style={{ fontSize: 8, letterSpacing: '0.2em', fontStyle: 'normal' }}>THINK</span>
        <br />
        {block.text}
        {cursor}
      </div>
    )
  }

  if (block.type === 'tool_use') {
    return (
      <div
        style={{
          fontSize: 10,
          color: 'var(--accent-warm)',
          border: '1px solid var(--accent-warm)',
          padding: '3px 8px',
          letterSpacing: '0.05em',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        ⚙ {(block.name ?? 'tool').toUpperCase()}
        {block.input && block.input !== '{}' ? ` ▸ ${block.input}` : ''}
        {cursor}
      </div>
    )
  }

  if (block.type === 'tool_result') {
    return (
      <div
        style={{
          fontSize: 10,
          color: 'var(--text-dim)',
          background: 'var(--bg-base)',
          border: '1px solid #0f2020',
          padding: '4px 8px',
          maxHeight: 160,
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        <span style={{ fontSize: 8, letterSpacing: '0.2em' }}>RESULT</span>
        <br />
        {block.result}
      </div>
    )
  }

  // text
  return (
    <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {block.text}
      {cursor}
    </span>
  )
}
