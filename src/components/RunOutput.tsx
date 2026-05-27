import React, { useEffect, useRef } from 'react'
import type { Run } from '../types'
import { BlockView, AttachmentChips } from './Blocks'
import { paramsSummary } from '../lib/runFormat'

interface RunOutputProps {
  run: Run | null
}

export function RunOutput({ run }: RunOutputProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [run?.output])

  if (!run) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: 'var(--bg-panel)',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-dim)',
          fontSize: 11,
          letterSpacing: '0.1em'
        }}
      >
        &gt;_ AWAITING INPUT — HIT RUN
      </div>
    )
  }

  const { tokenUsage } = run
  const maxTokens = run.params.maxTokens
  const usagePercent = Math.min(1, tokenUsage.output / maxTokens)
  const isHot = usagePercent > 0.85
  const meterColor = isHot ? 'var(--accent-warm)' : 'var(--accent)'
  const segmentCount = 20
  const activeSegments = Math.round(usagePercent * segmentCount)
  const streaming = run.status === 'streaming'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        background: 'var(--bg-panel)'
      }}
    >
      <div
        style={{
          padding: '6px 10px',
          borderBottom: '1px solid var(--panel-border)',
          color: 'var(--text-dim)',
          fontSize: 8,
          letterSpacing: '0.2em',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}
      >
        <span>RUN {run.index} · {run.status.toUpperCase()}</span>
        <span>
          {tokenUsage.input > 0 && `IN:${tokenUsage.input} `}
          {tokenUsage.output > 0 && `OUT:${tokenUsage.output}`}
        </span>
      </div>

      {/* params used + input */}
      <div
        style={{
          padding: '6px 12px',
          borderBottom: '1px solid var(--panel-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          flexShrink: 0,
          maxHeight: 120,
          overflowY: 'auto'
        }}
      >
        <span style={{ color: 'var(--accent)', fontSize: 9, letterSpacing: '0.08em' }}>
          {paramsSummary(run)}
        </span>
        {run.input.attachments.length > 0 && <AttachmentChips attachments={run.input.attachments} />}
        {run.input.text && (
          <span style={{ color: 'var(--text-mid)', fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            &gt; {run.input.text}
          </span>
        )}
      </div>

      <div
        className="selectable"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          color: 'var(--text-lcd)',
          fontSize: 12,
          lineHeight: 1.65
        }}
      >
        {run.output.map((block, i) => (
          <BlockView key={i} block={block} showCursor={streaming && i === run.output.length - 1} />
        ))}
        {streaming && run.output.length === 0 && (
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 13,
              background: 'var(--accent)',
              animation: 'blink 0.7s step-end infinite'
            }}
          />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Token meter */}
      <div
        style={{
          padding: '6px 10px',
          borderTop: '1px solid var(--panel-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0
        }}
      >
        <span style={{ color: 'var(--text-dim)', fontSize: 8, letterSpacing: '0.1em', minWidth: 24 }}>TOK</span>
        <div style={{ display: 'flex', gap: 2 }}>
          {Array.from({ length: segmentCount }, (_, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 8,
                background: i < activeSegments ? meterColor : '#1a1a1a',
                boxShadow: i < activeSegments && i === activeSegments - 1 ? `0 0 4px ${meterColor}` : 'none'
              }}
            />
          ))}
        </div>
        <span style={{ color: isHot ? 'var(--accent-warm)' : 'var(--text-dim)', fontSize: 8 }}>
          {Math.round(usagePercent * 100)}%
        </span>
      </div>
    </div>
  )
}
