import React, { useState, useCallback, useRef } from 'react'

interface InputBarProps {
  disabled: boolean
  onSubmit: (text: string) => void
}

export function InputBar({ disabled, onSubmit }: InputBarProps) {
  const [value, setValue] = useState('')
  const [pressed, setPressed] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = useCallback(() => {
    const text = value.trim()
    if (!text || disabled) return
    onSubmit(text)
    setValue('')
  }, [value, disabled, onSubmit])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  return (
    <div style={{
      display: 'flex',
      gap: 10,
      padding: '10px 14px',
      background: 'var(--bg-panel)',
      borderTop: '1px solid var(--panel-border)',
      boxShadow: 'var(--panel-shadow)',
      alignItems: 'flex-end'
    }}>
      <div style={{
        flex: 1,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--panel-border)',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
        padding: '6px 10px'
      }}>
        <textarea
          ref={ref}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="> input"
          rows={1}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: disabled ? 'var(--text-dim)' : 'var(--text-bright)',
            font: 'inherit',
            fontSize: 12,
            lineHeight: 1.5,
            caretColor: 'var(--accent)',
            overflow: 'hidden',
            minHeight: 20
          }}
          onInput={e => {
            const t = e.currentTarget
            t.style.height = 'auto'
            t.style.height = Math.min(t.scrollHeight, 100) + 'px'
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        style={{
          background: disabled || !value.trim()
            ? 'var(--bg-elevated)'
            : pressed
              ? '#007a99'
              : 'linear-gradient(to bottom, #00b8cc, #008fa0)',
          border: '1px solid',
          borderColor: disabled || !value.trim() ? 'var(--panel-border)' : '#00d4ee',
          borderBottomColor: disabled || !value.trim() ? 'var(--panel-border)' : '#006070',
          color: disabled || !value.trim() ? 'var(--text-dim)' : '#fff',
          font: 'inherit',
          fontSize: 10,
          letterSpacing: '0.15em',
          padding: '8px 14px',
          cursor: disabled || !value.trim() ? 'not-allowed' : 'pointer',
          boxShadow: pressed
            ? 'inset 0 2px 4px rgba(0,0,0,0.4)'
            : disabled || !value.trim()
              ? 'inset 0 1px 3px rgba(0,0,0,0.5)'
              : '0 0 10px rgba(0,229,255,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
          transform: pressed ? 'translateY(1px)' : 'none',
          transition: 'background 0.05s, box-shadow 0.05s',
          minWidth: 60,
          alignSelf: 'stretch'
        }}
      >
        SEND
      </button>
    </div>
  )
}
