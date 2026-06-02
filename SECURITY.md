# Security Policy

## Supported versions

Fluffy Parrot is a solo project. Only the latest `0.1.x` release receives security fixes.

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅        |
| < 0.1.0 | ❌        |

## Reporting a vulnerability

Please report security issues **privately** — do not open a public GitHub issue.

Email **me@vijay-patel.co.uk** with a description of the issue and steps to reproduce.
As a solo project, response times may vary, but reports are taken seriously and you'll
get an acknowledgement.

## Security model

- The Anthropic API key is stored encrypted in the macOS Keychain via `electron.safeStorage`.
  It is never written to disk in plaintext, held in renderer memory, or passed to the renderer process.
- The renderer runs with `contextIsolation: true` and `nodeIntegration: false`; it has no direct
  Node.js access. All Claude API calls and key storage happen in the main process over a narrow
  IPC surface (`hasKey`, `saveKey`, `sendMessage`, plus streaming event listeners).
- API requests go directly from the desktop app to `api.anthropic.com` — there is no intermediary backend.
