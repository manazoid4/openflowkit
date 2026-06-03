# Product Definition

## Product

OpenFlowKit is a local-first voice dictation and AI text refinement kit for people who write across many apps. It captures natural speech, transcribes it through local or cloud STT, refines it through LLM-agnostic routes, and injects polished text into the active writing surface.

It is not a generic transcription demo. It is a privacy-first voice layer for everyday writing, developer workflows, and team knowledge work.

## Core Job

Speak naturally anywhere and receive clean, context-aware text without giving up control of data or model routing.

The product should reduce:

* typing time
* manual cleanup
* provider lock-in
* privacy risk
* context switching

## Product Pillars

Dictation quality:

* accurate transcripts
* clean refinement
* correct punctuation and structure
* strong handling of edits, backtracks, names, jargon, and code terms

Local-first privacy:

* useful local mode
* explicit consent for cloud processing
* explicit consent for app context
* no hidden transcript storage
* clear retention controls on hosted plans

LLM-agnostic integration:

* OpenAI-compatible endpoint support
* Ollama, OpenRouter, Anthropic, Gemini, Groq, and self-hosted gateways
* provider health checks and fallback
* no model-specific product dependency

Paid SaaS wrapper:

* managed low-latency STT
* managed LLM cleanup
* cross-device sync
* advanced styles
* shared dictionaries and snippets
* admin policy, audit logs, usage analytics, and compliance support

## User Segments

Free users:

* want local dictation and BYOK refinement
* value control more than managed convenience
* should get a complete, useful core workflow

Pro users:

* want faster managed provider routes
* want sync, advanced styles, and app-specific profiles
* pay to remove setup and maintenance friction

Teams:

* need shared vocabulary, snippets, and admin controls
* care about consistent output and policy enforcement
* need visibility into usage without exposing unnecessary transcript content

Enterprise:

* needs private deployment, SSO, audit logs, retention controls, and compliance support
* may require dedicated model routing or regional processing guarantees

## Fixed Pipeline

```text
CAPTURE -> TRANSCRIBE -> REFINE -> PERSONALIZE -> INJECT -> SYNC
```

Capture:

* microphone stream, hotkey, selected text, and optional active app metadata

Transcribe:

* local-first STT with optional managed cloud routes

Refine:

* provider-neutral LLM cleanup using structured inputs and outputs

Personalize:

* local and shared dictionaries, snippets, style rules, and app profiles

Inject:

* paste into the active field while preserving clipboard behavior where possible

Sync:

* opt-in hosted sync for paid users and teams

## Success Metrics

Primary:

* accepted refined text rate
* correction rate after insertion
* speech-stop-to-injection latency
* paid retention

Secondary:

* local mode activation
* successful provider fallback rate
* dictionary and snippet hit rate
* team policy adoption

Provider count, transcript volume, and visual polish are not primary success metrics.
