import React, { useState } from 'react'

interface ApiKeyFieldProps {
  onSave: (key: string) => Promise<void>
  // Shown faint inside the input before the user types.
  placeholder?: string
  // Button label in its idle state.
  saveLabel?: string
  // Called after a successful save (e.g. to close a containing modal).
  onSaved?: () => void
  autoFocus?: boolean
}

// Validated Anthropic API-key input: enforces the sk-ant- prefix, surfaces
// errors inline, and disables itself while saving. Shared by the first-run
// setup and the settings panel.
export function ApiKeyField({
  onSave,
  placeholder = 'sk-ant-...',
  saveLabel = 'SAVE',
  onSaved,
  autoFocus = true
}: ApiKeyFieldProps) {
  const [key, setKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    const trimmed = key.trim()
    if (!trimmed.startsWith('sk-ant-')) {
      setError('Key must start with sk-ant-')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(trimmed)
      setKey('')
      onSaved?.()
    } catch (e) {
      setError(String(e))
      setSaving(false)
    }
  }

  return (
    <>
      <div style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${error ? 'var(--led-red)' : 'var(--panel-border)'}`,
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
        padding: '6px 10px',
        marginBottom: 12
      }}>
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder={placeholder}
          autoFocus={autoFocus}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-bright)',
            font: 'inherit',
            fontSize: 12,
            caretColor: 'var(--accent)'
          }}
        />
      </div>

      {error && (
        <div style={{
          color: 'var(--led-red)',
          fontSize: 9,
          marginBottom: 12,
          letterSpacing: '0.1em'
        }}>
          ERR: {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !key.trim()}
        style={{
          width: '100%',
          padding: '8px',
          background: saving ? 'var(--bg-elevated)' : 'linear-gradient(to bottom, #00b8cc, #008fa0)',
          border: '1px solid',
          borderColor: saving ? 'var(--panel-border)' : '#00d4ee',
          color: saving ? 'var(--text-dim)' : '#fff',
          font: 'inherit',
          fontSize: 10,
          letterSpacing: '0.2em',
          cursor: saving ? 'not-allowed' : 'pointer',
          boxShadow: saving ? 'none' : '0 0 10px rgba(0,229,255,0.2)'
        }}
      >
        {saving ? 'SAVING...' : saveLabel}
      </button>

      <div style={{
        marginTop: 12,
        color: 'var(--text-dim)',
        fontSize: 8,
        lineHeight: 1.6,
        letterSpacing: '0.05em'
      }}>
        Key stored encrypted via OS keychain. Never leaves your machine.
      </div>
    </>
  )
}
