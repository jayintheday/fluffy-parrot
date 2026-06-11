# Fluffy Parrot — Agent Orientation

## Overview

Fluffy Parrot is a **macOS Electron desktop app** that provides a hardware-synthesiser–style UI for the Anthropic Claude API. Every generation parameter (temperature, top-p, top-k, max tokens) is a physical drag-able SVG knob. Responses stream live into a CRT-aesthetic conversation panel. API keys are stored encrypted in the macOS OS keychain — they never touch the renderer process.

This is **not a web app**. Distribution target is macOS DMG only.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop runtime | Electron 32.2.6 |
| UI framework | React 18.3.1 + TypeScript 5.6.3 |
| Claude API client | `@anthropic-ai/sdk` 0.32.1 |
| Build tool | electron-vite 2.3.0 (wraps Vite 5.4) |
| Packaging | electron-builder 25.1.8 |
| Styling | CSS custom properties + inline styles (no UI library) |
| Font | JetBrains Mono (Google Fonts) |

---

## Architecture

Three-tier Electron process model:

```
┌─────────────────────────────────┐
│  RENDERER  (src/)               │
│  React UI, hooks, state         │
│  window.electronAPI (typed)     │
└──────────────┬──────────────────┘
               │ contextBridge IPC
               ↓
┌─────────────────────────────────┐
│  PRELOAD  (electron/preload.ts) │
│  Exposes safe surface only      │
│  contextIsolation: true         │
└──────────────┬──────────────────┘
               │ ipcRenderer / ipcMain
               ↓
┌─────────────────────────────────┐
│  MAIN  (electron/main.ts)       │
│  Anthropic SDK, safeStorage     │
│  IPC handlers, window creation  │
└─────────────────────────────────┘
```

The renderer has **no direct Node.js access**. All Claude API calls and key storage go through IPC.

---

## Key Files

```
electron/
  main.ts           — Window creation, OS keychain key storage, Anthropic SDK calls,
                      IPC handlers (api:hasKey, api:saveKey, api:sendMessage),
                      streaming chunk relay (api:chunk, api:done events)
  preload.ts        — contextBridge exposing window.electronAPI to renderer

src/
  App.tsx           — Root component; layout orchestration; all top-level state
  types.ts          — ClaudeParams, Message, LEDState interfaces + window.electronAPI types
  main.tsx          — ReactDOM.createRoot mount
  index.html        — HTML entry point

  components/
    KnobBank.tsx    — Row of 4 parameter knobs + stream mode toggle
    Knob.tsx        — Reusable SVG rotary knob (270° arc, tick marks, hot state)
    ModelSelector.tsx — rotary model selector; detents spread across a 270° arc
                      sized to the model count (driven by src/lib/models.ts)
    Display.tsx     — System prompt textarea (LCD-green on dark blue, scanlines overlay)
    ConversationView.tsx — Message thread + 20-segment token meter
    InputBar.tsx    — Auto-expanding textarea + SEND button
    LEDIndicator.tsx — Status LED: off / green (ready) / amber (streaming) / red (error)
    APIKeySetup.tsx  — One-time modal for entering and storing the API key

  hooks/
    useClaude.ts    — Manages messages[], streaming state, token usage; subscribes to
                      api:chunk and api:done IPC events
    useKnobDrag.ts  — Vertical drag, shift-drag (10× fine), scroll wheel, snap-to-step

  styles/
    design-tokens.css — All CSS custom properties (colors, glows, spacing, shadows)
    global.css        — Reset and base styles

electron.vite.config.ts — Build entry points for main, preload, renderer
package.json            — Scripts, electron-builder config (appId: co.vijay-patel.fluffy-parrot)
```

---

## Message / Streaming Data Flow

```
InputBar.handleSend()
  └→ useClaude.sendMessage(text, params)
       ├→ Adds user Message to state (id = uid())
       ├→ Adds empty assistant Message (streaming: true)
       └→ window.electronAPI.sendMessage(payload)
            ↓ IPC to main process
            electron/main.ts ipcMain.handle('api:sendMessage')
              ├→ Reads encrypted key from safeStorage
              ├→ Instantiates Anthropic({ apiKey })
              ├→ if stream=true → client.messages.stream()
              │     for-await chunk → event.sender.send('api:chunk', { id, delta })
              │     on complete   → event.sender.send('api:done', { id, usage })
              └→ if stream=false → client.messages.create() (single response)
            ↓ IPC events back to renderer
            useClaude onChunk listener → appends delta to assistant message content
            useClaude onDone listener  → sets streaming=false, updates tokenUsage
```

---

## Claude API Parameters

| Knob | Range | Default | Notes |
|---|---|---|---|
| Temperature | 0.0 – 1.0 | 1.0 | Mutually exclusive with top-p (see below) |
| Top-P | 0.0 – 1.0 | 1.0 | When < 0.999 it replaces temperature in the request |
| Top-K | 0 – 500 | 0 | Omitted from request when 0 |
| Max Tokens | 256 – model max | 2048 | Caps at the selected model's `maxOutput` (64K Haiku/Sonnet, 128K Opus/Fable); switching models clamps the value down. Also sets the token meter scale. |

**Critical constraints** (`electron/main.ts` + `src/lib/apiRequest.ts` — keep both in sync):
- The Anthropic API rejects requests that include both `temperature` and `top_p`. The build logic sends `top_p` if the knob is below 0.999, otherwise `temperature`.
- Sampling params (`temperature`/`top_p`/`top_k`) and manual `thinking.budget_tokens` are model-gated via `src/lib/models.ts` (`allowsSampling`, `thinkingMode`). Adaptive-thinking models (Opus 4.7+, Fable) reject them. The `thinking` key is only ever added when the THINK toggle is on, so a `{type:"disabled"}` is never sent (this matters for Fable 5, which 400s on explicit disable).

**Models** — single source of truth is `src/lib/models.ts` (`MODELS` array + `getModel()`); both the renderer and `electron/main.ts` import it. Each entry carries capability flags (`thinkingMode`, `allowsSampling`, `effortSupported`), `maxOutput`, and `price`. Currently registered:
- `claude-haiku-4-5-20251001` — HAIKU
- `claude-sonnet-4-6` — SONNET (default)
- `claude-opus-4-7` — OPUS 4.7
- `claude-opus-4-8` — OPUS 4.8
- `claude-fable-5` — FABLE 5 (top tier, $10/$50 per 1M)

Adding a model is normally just a new `MODELS` entry — the selector, pricing, run summaries, and request builders all read from the registry.

---

## Dev Commands

```bash
npm run dev      # Start with hot reload (electron-vite dev)
npm run build    # Production build + DMG packaging (electron-vite build && electron-builder)
npm run preview  # Preview production renderer build
```

Output directories (git-ignored):
- `out/` — compiled main and preload JS
- `dist/` — renderer bundle

---

## Security Model

- `contextIsolation: true`, `nodeIntegration: false` — renderer is sandboxed.
- API key stored via `electron.safeStorage` (OS keychain encryption). Never passed back to renderer.
- Preload exposes only four methods: `hasKey`, `saveKey`, `sendMessage`, `onChunk`/`onDone` listeners.
- Key validation (`sk-ant-` prefix check) happens in the renderer; actual storage and use happen only in the main process.

---

## Styling Conventions

- All colors, shadows, and glows live in `src/styles/design-tokens.css` as CSS custom properties. Edit there, not inline.
- Components use inline `style={{}}` objects for layout and component-specific values — there is no CSS module or Tailwind.
- "Hot" state (orange glow) triggers at >85% of a parameter's range — controlled by the `isHot` prop on `Knob`.
- Window is frameless (1100×700, min 900×620, max 1400×900). macOS traffic lights positioned at (14, 14).

---

## Known Constraints

- **macOS only** — `safeStorage` and `electron-builder` target are macOS-specific. No Windows/Linux support.
- **No test suite** — there are no unit or integration tests.
- **No UI library** — all components are hand-rolled with inline styles and SVG.
- **Single conversation** — no session persistence; CLR button wipes state in memory only.
- **No proxy / backend** — API calls go directly from the desktop app to `api.anthropic.com`.
