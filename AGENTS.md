# CODEX SYSTEM INSTRUCTIONS - OPENFLOWKIT

## OBJECTIVE

Build OpenFlowKit into a revenue-generating SaaS and open-source kit for privacy-first voice dictation, AI text refinement, and app-wide text injection.

This is NOT a generic transcription demo.

This is a local-first voice productivity system.

---

## CORE PRODUCT LOGIC

OpenFlowKit:

* captures voice from desktop or browser surfaces
* transcribes through local or cloud STT providers
* refines speech into clean, usable text through LLM-agnostic integrations
* personalizes output with dictionaries, snippets, style rules, and app context
* injects the result into the active writing surface with minimal friction

Goal:
SAY IT NATURALLY, GET CLEAN TEXT, KEEP CONTROL OF DATA AND MODELS.

---

## PRIORITY ORDER (STRICT)

1. Dictation quality and output usefulness
2. Local-first privacy and user control
3. Pipeline reliability and provider fallback
4. Low-latency capture, transcription, refinement, and injection
5. Monetisation hooks
6. UX simplicity

Never prioritise UI polish over privacy, accuracy, latency, or provider reliability.

---

## EXECUTION STYLE

* Do NOT ask questions unless blocked
* Do NOT over-plan
* Execute one task at a time
* Keep changes modular
* Avoid scanning the entire codebase
* Do not edit app source, package files, or deployment config unless explicitly asked

---

## DATA STRATEGY

Primary inputs:

* microphone audio
* structured transcript segments
* optional selected text or active-app metadata with explicit consent
* user dictionaries, snippets, and style profiles

Secondary inputs:

* team dictionaries
* app-specific formatting rules
* usage and latency telemetry on paid plans with clear consent

---

## DATA RULES

* No fake transcript outputs in production paths
* No silent cloud routing
* No hidden dictation retention
* Always return structured results from capture, transcription, refinement, and injection steps
* Local mode must remain useful without internet access

If a real provider is unavailable:

* fall back to a configured local route, cached provider status, or a structured error
* do not invent completed dictation results

---

## DICTATION RESULT SCHEMA (FIXED)

Each dictation result must include:

* id
* rawTranscript
* refinedText
* language
* mode
* providerRoute
* latencyMs
* confidence
* privacyMode
* appContext
* status

---

## REFINEMENT LOGIC (CRITICAL)

Prioritise:

* spoken intent preservation
* filler and backtrack cleanup
* punctuation and paragraph structure
* app-appropriate formatting
* developer syntax and command accuracy
* dictionary and snippet adherence

Output must be ready to paste, send, or commit without extra cleanup.

---

## WHAT TO AVOID

* Do NOT build a generic chatbot
* Do NOT build a generic transcription-only product
* Do NOT fetch sensitive dictation data in frontend-only flows
* Do NOT simulate privacy or provider logic in UI
* Do NOT lock the core to one LLM, STT provider, or model vendor
* Do NOT over-engineer abstractions before the capture-to-inject loop works
* Do NOT rely on long prompts where deterministic formatting rules will work

---

## SYSTEM ARCHITECTURE

Use:

CAPTURE -> TRANSCRIBE -> REFINE -> PERSONALIZE -> INJECT -> SYNC

* Capture via native desktop app, browser extension, or explicit web input
* Transcription via local-first STT with optional managed cloud routes
* Refinement via LLM-agnostic provider interface
* Personalization via local dictionaries, snippets, style rules, and team policies
* Injection via active text field paste or supported app integrations
* Sync via opt-in hosted service for paid users and teams

---

## AI USAGE

* Use small, fast local or hosted models for high-volume cleanup
* Use stronger models only for complex rewriting, onboarding, style generation, or enterprise enrichment
* Support OpenAI-compatible endpoints, Ollama, OpenRouter, Anthropic, Gemini, Groq, and self-hosted gateways

Never make bulk dictation refinement depend on one expensive model.

---

## MONETISATION LOGIC

Free:

* local transcription
* BYOK LLM cleanup
* personal dictionary
* local snippets
* basic privacy mode

Paid:

* managed fast STT and LLM routes
* cross-device sync
* advanced styles
* app-specific profiles
* team dictionaries and snippets
* usage analytics, policy controls, audit logs, and compliance support

Never block the product shell. Gate managed convenience, team controls, and data depth.

---

## DELIVERY SYSTEM

Primary output channel:

* the active text field or requested writing surface

Dictation output must be:

* concise when the user speaks concisely
* structured when the user asks for structure
* faithful to intent
* immediately actionable

---

## PERFORMANCE RULES

* Minimise token usage
* Avoid repeated provider calls
* Cache provider capability and health checks
* Prefer streaming or incremental processing where it reduces perceived latency
* Keep local routes available when cloud routes fail

---

## LEGAL AND PRIVACY CONSTRAINTS

* Default to local-first processing
* Require explicit consent for app context, cloud processing, storage, and analytics
* Publish subprocessors and retention policies for hosted plans
* Assume GDPR and UK/EU data protection requirements

---

## CI/CD RULES

* Always ensure build runs before deploy
* Output directory: dist
* Vercel and hosting config must remain production-safe
* Never leave deploy docs pointing to preview-only channels

---

## SUCCESS METRIC

System success is NOT:

* number of supported providers
* raw transcript volume
* UI surface count

System success IS:

* time saved per user
* accepted refined text rate
* low correction rate
* low latency from speech stop to text injection
* paid retention

---

## MINDSET

You are not building transcription features.

You are building:
A privacy-first system that turns natural speech into production-ready text anywhere.

Focus on:
QUALITY > PROVIDER COUNT
PRIVACY > CLOUD CONVENIENCE
LATENCY > COMPLEXITY
EXECUTION > THEORY
