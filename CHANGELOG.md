# Changelog

All notable changes to Fluffy Parrot are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] — 2026-06-11

### Added

- Claude Fable 5 as a selectable model — a fifth position on the model knob, Anthropic's top-tier model (adaptive thinking, effort-controlled).

### Changed

- The Max Tokens knob now scales to the selected model's output ceiling (up to 128K for Opus / Fable, 64K for Haiku / Sonnet) instead of a fixed 8192 cap. Switching to a lower-ceiling model clamps the current value down.

[0.2.0]: https://github.com/jayintheday/fluffy-parrot/releases/tag/v0.2.0

## [0.1.0] — 2026-06-02

First public release.

### Added

- Rotary knobs for Temperature, Top-P, Top-K, and Max Tokens — drag vertically, hold Shift for fine control, or use the scroll wheel.
- Three-position model knob: Haiku / Sonnet / Opus.
- Live streaming responses with a 20-segment token meter.
- System prompt editor (LCD-green on dark blue with scanlines).
- Prompt comparison lab — run two parameter configurations side by side and diff the outputs.
- 4 themes: Default, Titanium, Cold Steel, Gunmetal.
- API key stored encrypted in the macOS Keychain via `electron.safeStorage` — never held in app memory or passed to the renderer process.

### Requirements

- macOS 13 Ventura or later, Apple silicon.
- An Anthropic API key (`sk-ant-...`).

[0.1.0]: https://github.com/jayintheday/fluffy-parrot/releases/tag/v0.1.0
