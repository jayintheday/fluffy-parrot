import React, { useCallback, useRef, useState } from 'react'
import type { Attachment } from '../types'

interface InputBarProps {
  disabled: boolean
  value: string
  attachments: Attachment[]
  onChange: (v: string) => void
  onAttachmentsChange: (a: Attachment[]) => void
  onSubmit: () => void
}

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '')
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export function InputBar({ disabled, value, attachments, onChange, onAttachmentsChange, onSubmit }: InputBarProps) {
  const [pressed, setPressed] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const canSend = (!!value.trim() || attachments.length > 0) && !disabled

  const handleSubmit = useCallback(() => {
    if (!canSend) return
    onSubmit()
  }, [canSend, onSubmit])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return
      const next: Attachment[] = []
      for (const file of Array.from(files)) {
        const data = await readBase64(file)
        if (!data) continue
        if (file.type === 'application/pdf') {
          next.push({ kind: 'pdf', mediaType: 'application/pdf', data, name: file.name })
        } else if (file.type.startsWith('image/')) {
          next.push({ kind: 'image', mediaType: file.type, data, name: file.name })
        }
      }
      onAttachmentsChange([...attachments, ...next])
      if (fileRef.current) fileRef.current.value = ''
    },
    [attachments, onAttachmentsChange]
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '10px 14px',
        background: 'var(--bg-panel)',
        borderTop: '1px solid var(--panel-border)',
        boxShadow: 'var(--panel-shadow)'
      }}
    >
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {attachments.map((a, i) => (
            <span
              key={i}
              onClick={() => onAttachmentsChange(attachments.filter((_, j) => j !== i))}
              title="Click to remove"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 9,
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
                padding: '2px 6px',
                cursor: 'pointer',
                letterSpacing: '0.05em'
              }}
            >
              {a.kind === 'image' ? '🖼' : 'PDF'} {a.name} ×
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          title="Attach image or PDF"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--panel-border)',
            color: disabled ? 'var(--text-dim)' : 'var(--accent)',
            font: 'inherit',
            fontSize: 14,
            padding: '6px 10px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            alignSelf: 'stretch'
          }}
        >
          +
        </button>

        <div
          style={{
            flex: 1,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--panel-border)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
            padding: '6px 10px'
          }}
        >
          <textarea
            ref={ref}
            value={value}
            onChange={e => onChange(e.target.value)}
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
          disabled={!canSend}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onMouseLeave={() => setPressed(false)}
          style={{
            background: !canSend
              ? 'var(--bg-elevated)'
              : pressed
                ? 'var(--run-btn-bg-pressed, #007a99)'
                : 'var(--run-btn-bg, linear-gradient(to bottom, #00b8cc, #008fa0))',
            border: '1px solid',
            borderColor: !canSend ? 'var(--panel-border)' : 'var(--run-btn-border, #00d4ee)',
            borderBottomColor: !canSend ? 'var(--panel-border)' : 'var(--run-btn-border-b, #006070)',
            color: !canSend ? 'var(--text-dim)' : 'var(--run-btn-text, #fff)',
            font: 'inherit',
            fontSize: 10,
            letterSpacing: '0.15em',
            padding: '8px 14px',
            cursor: !canSend ? 'not-allowed' : 'pointer',
            boxShadow: pressed
              ? 'inset 0 2px 4px rgba(0,0,0,0.4)'
              : !canSend
                ? 'inset 0 1px 3px rgba(0,0,0,0.5)'
                : '0 0 10px var(--run-btn-glow, rgba(0,229,255,0.25)), inset 0 1px 0 rgba(255,255,255,0.15)',
            transform: pressed ? 'translateY(1px)' : 'none',
            transition: 'background 0.05s, box-shadow 0.05s',
            minWidth: 60,
            alignSelf: 'stretch'
          }}
        >
          RUN
        </button>
      </div>
    </div>
  )
}
