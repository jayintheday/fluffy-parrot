import React, { useRef, useState } from 'react'
import type { Attachment } from '../types'

interface ContextUploadProps {
  files: Attachment[]
  onAdd: (a: Attachment) => void
  onRemove: (name: string) => void
}

const TEXT_EXTENSIONS = new Set([
  '.md', '.txt', '.csv', '.json', '.yaml', '.yml',
  '.ts', '.tsx', '.js', '.jsx', '.py', '.rb', '.go',
  '.rs', '.sh', '.html', '.css', '.xml', '.toml'
])

function isTextFile(file: File): boolean {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  return TEXT_EXTENSIONS.has(ext) || file.type.startsWith('text/')
}

function readFileAsAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    const mime = file.type

    if (mime === 'application/pdf') {
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve({ kind: 'pdf', mediaType: 'application/pdf', data: base64, name: file.name })
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    } else if (mime.startsWith('image/')) {
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve({ kind: 'image', mediaType: mime, data: base64, name: file.name })
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    } else if (isTextFile(file)) {
      reader.onload = () => {
        resolve({ kind: 'text', mediaType: 'text/plain', data: reader.result as string, name: file.name })
      }
      reader.onerror = reject
      reader.readAsText(file)
    } else {
      reject(new Error(`Unsupported file type: ${mime}`))
    }
  })
}

const TEXT_EXT_LIST = Array.from(TEXT_EXTENSIONS).join(',')
const ACCEPT = `.pdf,image/*,${TEXT_EXT_LIST}`

export function ContextUpload({ files, onAdd, onRemove }: ContextUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return
    for (const file of Array.from(fileList)) {
      try {
        const attachment = await readFileAsAttachment(file)
        onAdd(attachment)
      } catch {
        // silently skip unsupported types
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div style={{
      borderTop: '1px solid var(--panel-border)',
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '6px 10px',
        borderBottom: '1px solid var(--panel-border)',
        color: 'var(--text-dim)',
        fontSize: 8,
        letterSpacing: '0.2em'
      }}>
        CTX·FILES
      </div>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          margin: '6px 8px 4px',
          padding: '6px 10px',
          border: `1px dashed ${dragOver ? 'var(--accent)' : 'var(--panel-border)'}`,
          cursor: 'pointer',
          textAlign: 'center',
          color: dragOver ? 'var(--accent)' : 'var(--text-dim)',
          fontSize: 8,
          letterSpacing: '0.15em',
          transition: 'color 0.1s, border-color 0.1s',
          boxShadow: dragOver ? '0 0 6px var(--accent-glow)' : 'none'
        }}
      >
        DROP·FILE / CLICK
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)}
        // reset value so the same file can be re-added after removal
        onClick={e => { (e.target as HTMLInputElement).value = '' }}
      />

      {/* File list */}
      {files.length > 0 && (
        <div style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '2px 8px 6px'
        }}>
          {files.map(f => (
            <div key={f.name} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '3px 4px',
              marginBottom: 2,
              background: 'var(--bg-display)',
              border: '1px solid var(--display-border, #0f2020)'
            }}>
              <span style={{
                color: 'var(--text-lcd)',
                fontSize: 9,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                marginRight: 6
              }}>
                {f.name}
              </span>
              <button
                onClick={() => onRemove(f.name)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  font: 'inherit',
                  fontSize: 9,
                  padding: '0 2px',
                  lineHeight: 1,
                  flexShrink: 0
                }}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
