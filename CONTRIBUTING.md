# Contributing to Fluffy Parrot

Thanks for your interest. This is a solo project that I'm opening up — contributions are welcome but response times may vary.

## Prerequisites

- macOS (the app is macOS-only; the build toolchain requires it)
- Node.js 20 or later
- npm

## Getting started

```bash
git clone https://github.com/jayintheday/fluffy-parrot.git
cd fluffy-parrot
npm install
npm run dev
```

The app launches in development mode with hot reload. The Electron main process restarts when you change files in `electron/`. The renderer hot-reloads for changes in `src/`.

## Project structure

See `CLAUDE.md` for a detailed orientation: architecture diagram, key files, data flow, API parameter constraints, and styling conventions.

## Things to keep in mind

- **Temperature/top_p are mutually exclusive** — the Anthropic API rejects requests that include both. The logic in `electron/main.ts` handles this by sending `top_p` when its knob is below 0.999, otherwise `temperature`. Don't break this.
- **Design tokens** — all colors, shadows, and glows live in `src/styles/design-tokens.css`. Edit there, not inline.
- **No test suite** — manual testing is expected. There are no unit or integration tests.

## Submitting a pull request

- Open an issue first for anything non-trivial, so we can discuss before you invest time coding.
- Keep PRs focused — one thing per PR.
- Match the existing code style (TypeScript, inline styles, no UI library).
- Describe what the PR does and why in the description.

## Reporting bugs

Open a GitHub issue. Include: macOS version, what you did, what you expected, what happened. Screenshots help.
