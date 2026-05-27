import React, { useEffect, useRef } from 'react'
import type { Message, TokenUsage } from '../types'

interface ConversationViewProps {
  messages: Message[]
  tokenUsage: TokenUsage
  maxTokens: number
}

export function ConversationView({ messages, tokenUsage, maxTokens }: ConversationViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const usagePercent = Math.min(1, tokenUsage.output / maxTokens)
  const isHot = usagePercent > 0.85
  const meterColor = isHot ? 'var(--accent-warm)' : 'var(--accent)'
  const segmentCount = 20
  const activeSegments = Math.round(usagePercent * segmentCount)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-panel)'
    }}>
      <div style={{
        padding: '6px 10px',
        borderBottom: '1px solid var(--panel-border)',
        color: 'var(--text-dim)',
        fontSize: 8,
        letterSpacing: '0.2em',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>OUTPUT</span>
        <span style={{ color: 'var(--text-dim)' }}>
          {tokenUsage.input > 0 && `IN:${tokenUsage.input} `}
          {tokenUsage.output > 0 && `OUT:${tokenUsage.output}`}
        </span>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        {messages.length === 0 && (
          <div style={{
            color: 'var(--text-dim)',
            fontSize: 11,
            textAlign: 'center',
            marginTop: 40,
            letterSpacing: '0.1em'
          }}>
            &gt;_ AWAITING INPUT
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              gap: 3
            }}
          >
            <span style={{
              fontSize: 8,
              color: 'var(--text-dim)',
              letterSpacing: '0.15em'
            }}>
              {msg.role === 'user' ? 'USR' : 'AST'}
            </span>
            <div style={{
              maxWidth: '85%',
              padding: '6px 10px',
              background: msg.role === 'user' ? 'var(--bg-elevated)' : 'var(--bg-base)',
              border: `1px solid ${msg.role === 'user' ? 'var(--panel-border)' : '#0f2020'}`,
              color: msg.role === 'user' ? 'var(--text-bright)' : 'var(--text-lcd)',
              fontSize: 12,
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {msg.content}
              {msg.streaming && (
                <span style={{
                  display: 'inline-block',
                  width: 8,
                  height: 13,
                  background: 'var(--accent)',
                  marginLeft: 2,
                  verticalAlign: 'text-bottom',
                  animation: 'blink 0.7s step-end infinite'
                }} />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Token meter */}
      <div style={{
        padding: '6px 10px',
        borderTop: '1px solid var(--panel-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}>
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

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  )
}
