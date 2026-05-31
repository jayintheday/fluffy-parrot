import React, { useEffect } from 'react'
import { ApiKeyField } from './ApiKeyField'

interface SettingsModalProps {
  hasKey: boolean
  onSaveKey: (key: string) => Promise<void>
  onClose: () => void
}

// Settings overlay. Currently exposes a single setting — the Anthropic API key —
// shown with its stored/not-set status. Closes via the × button, backdrop click,
// or Escape. Visual language mirrors the original first-run key modal.
export function SettingsModal({ hasKey, onSaveKey, onClose }: SettingsModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--panel-border)',
          padding: 32,
          minWidth: 380,
          boxShadow: '0 0 40px rgba(0,0,0,0.8)'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24
        }}>
          <div style={{
            color: 'var(--accent)',
            fontSize: 10,
            letterSpacing: '0.25em'
          }}>
            SETTINGS
          </div>
          <button
            onClick={onClose}
            title="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              font: 'inherit',
              fontSize: 16,
              lineHeight: 1,
              cursor: 'pointer',
              padding: 0
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          color: 'var(--text-dim)',
          fontSize: 9,
          letterSpacing: '0.15em',
          marginBottom: 12
        }}>
          ANTHROPIC API KEY
        </div>

        <div style={{
          fontSize: 9,
          letterSpacing: '0.1em',
          marginBottom: 16,
          color: hasKey ? 'var(--text-dim)' : 'var(--led-red)'
        }}>
          {hasKey ? '•••••••• (stored)' : 'not set'}
        </div>

        <ApiKeyField
          onSave={onSaveKey}
          onSaved={onClose}
          placeholder={hasKey ? 'sk-ant-...  (replace existing)' : 'sk-ant-...'}
          saveLabel={hasKey ? 'REPLACE' : 'SAVE'}
        />
      </div>
    </div>
  )
}
