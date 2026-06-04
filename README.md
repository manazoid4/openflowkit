# OpenFlowKit

OpenFlowKit is an open-source, LLM-agnostic voice dictation and AI text refinement kit inspired by the best parts of Wispr Flow, Superwhisper, VoiceInk, OpenWhispr, OpenTypeless, and other modern dictation tools.

It is not a generic transcription demo. The goal is a privacy-first voice layer that works across apps, IDEs, and LLM workflows:

- speak naturally into any text field
- transcribe through local or cloud STT providers
- clean filler words, backtracks, punctuation, tone, and structure
- adapt to dictionaries, snippets, writing styles, and developer syntax
- integrate with any OpenAI-compatible LLM, Ollama, OpenRouter, Anthropic, Gemini, or self-hosted model gateway
- monetize by gating cloud convenience, team controls, usage analytics, and managed enterprise compliance

## Why this exists

Wispr Flow is polished, but it is proprietary and cloud-heavy. Open-source alternatives cover pieces of the workflow, usually local Whisper transcription or a desktop hotkey. OpenFlowKit focuses on the missing layer: provider abstraction, app integrations, privacy controls, team policy, and a credible paid SaaS wrapper around a free core.

## What's new (2026-06-03)

- **Browser MVP voice capture** — Web Speech API push-to-talk with real-time transcript display
- **Terminal bridge** — WebSocket relay for desktop injection + command mode
- **Dictation pipeline** — Capture → Transcribe → Refine → Inject with full latency tracking
- **Enhanced refinement** — Self-correction resolution, deduplication, style adaptation (concise/formal), document formatting
- **Comprehensive tests** — Refinement, capture, and dictation pipeline test coverage
- **Strategic report** — Competitor analysis, market sizing, profit margins, five moats, and 3-year financial model in `docs/REPORT_2026-06-03.md`

## Current scope

This first repository ships:

- a typed TypeScript core for dictation requests, provider contracts, refinement, and monetisation tiers
- a working Vite/React web surface with live voice capture, terminal bridge, integrations, pricing, and architecture sections
- research notes and product architecture docs
- a build output path of `dist`

Desktop capture, native paste injection, and background hotkeys should be implemented next with Tauri or Electron. The core interfaces are designed so that native clients can reuse the same transcription and refinement pipeline.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and click **Push to Talk** to try the browser voice capture.

Build:

```bash
npm run build
```

Run tests:

```bash
npm run test
```

## Architecture

```text
CAPTURE -> TRANSCRIBE -> REFINE -> PERSONALIZE -> INJECT -> SYNC
```

The open-source core should stay provider-neutral. Paid features should gate managed infrastructure, team controls, and convenience, not the basic ability to dictate with user-owned models.

## Product model

Free:

- local transcription
- BYOK LLM cleanup
- personal dictionary
- local snippets
- no vendor lock-in

Pro:

- managed cloud STT
- faster refinement
- cross-device sync
- advanced styles
- prompt and snippet packs

Teams:

- shared dictionary
- shared snippets
- usage dashboards
- admin policy controls
- SSO-ready architecture

Enterprise:

- private deployment
- audit logs
- retention controls
- managed compliance
- custom model routing

## Roadmap

See `docs/ROADMAP.md` for the full prioritised roadmap. High-level phases:

1. **Browser MVP** (Now) — Web Speech API capture, terminal bridge, refinement pipeline
2. **Desktop Bridge** (July 2026) — Tauri/Electron wrapper, global hotkeys, local Whisper
3. **Cloud & Team** (August 2026) — Managed STT, LLM gateway, team sync, Stripe billing
4. **Enterprise & Moats** (Q4 2026) — SOC 2, HIPAA, SSO, private deployment
5. **Scale & Exit** (2027) — 5,000+ seats, $1M+ ARR, acquisition conversations

## Research & Strategy

- `docs/REPORT_2026-06-03.md` — Comprehensive strategic report with competitor audit, market analysis ($22.5B voice recognition market), profit margins (80% gross), five moats, name risk analysis, voice-training strategy, and sneaky launch tactics
- `AGENTS.md` — System instructions for AI agents working on this codebase

## License

AGPL-3.0-or-later. The core stays open. SaaS wrappers and managed features can be proprietary.
