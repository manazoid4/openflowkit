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

## Current scope

This first repository ships:

- a typed TypeScript core for dictation requests, provider contracts, refinement, and monetisation tiers
- a working Vite/React web surface with integrations, pricing, and architecture sections
- research notes and product architecture docs
- a build output path of `dist`

Desktop capture, native paste injection, and background hotkeys should be implemented next with Tauri or Electron. The core interfaces are designed so that native clients can reuse the same transcription and refinement pipeline.

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

## Local development

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Architecture

```text
CAPTURE -> TRANSCRIBE -> REFINE -> PERSONALIZE -> INJECT -> SYNC
```

The open-source core should stay provider-neutral. Paid features should gate managed infrastructure, team controls, and convenience, not the basic ability to dictate with user-owned models.

## Research sources

See [docs/research.md](docs/research.md) for the current product and open-source landscape.
