# Roadmap

## Principle

OpenFlowKit should earn revenue by making dictation faster, cleaner, safer, and easier to operate. Do not chase generic AI features. Build the capture-to-inject loop first, then add paid convenience around it.

Priority order:

1. Dictation quality
2. Local-first privacy
3. Pipeline reliability
4. Low latency
5. Monetisation hooks
6. UX simplicity

## Phase 1 - Core Loop

Goal:

* make natural speech become ready-to-paste text through a structured pipeline

Scope:

* define dictation result schema
* support local STT route
* support at least one OpenAI-compatible LLM route
* refine filler, backtracks, punctuation, and paragraphing
* return structured status and confidence metadata
* keep local mode functional without internet access

Exit criteria:

* user can dictate, refine, and receive usable text
* no fake outputs or placeholder provider behavior
* provider failures return structured errors

## Phase 2 - Native Capture and Injection

Goal:

* make OpenFlowKit work across apps, not only inside a web page

Scope:

* desktop hotkey
* microphone capture
* active-field paste injection
* clipboard preservation
* command mode for selected text
* optional active app metadata with explicit consent

Exit criteria:

* speech-stop-to-injection latency is tracked
* privacy mode blocks app context unless enabled
* injected text is ready to use without manual cleanup

## Phase 3 - Personalization

Goal:

* make output match the user's vocabulary, tone, and work context

Scope:

* personal dictionary
* local snippets
* style profiles
* developer syntax handling
* app-specific formatting rules

Exit criteria:

* dictionary terms are reliably applied
* code symbols, filenames, acronyms, and CLI commands survive refinement
* snippets reduce repeated writing effort

## Phase 4 - Paid SaaS

Goal:

* monetize managed convenience while preserving the open local core

Scope:

* managed fast STT
* managed LLM cleanup
* cross-device sync
* advanced style packs
* usage limits by plan
* billing-ready entitlement checks

Exit criteria:

* free users retain useful local dictation
* paid users get measurable latency or convenience gains
* paywalls gate managed infrastructure and sync, not the product shell

## Phase 5 - Teams

Goal:

* make OpenFlowKit useful for shared work without compromising privacy

Scope:

* shared dictionaries
* shared snippets
* team style profiles
* usage dashboard
* policy controls
* admin billing

Exit criteria:

* teams can standardize vocabulary and snippets
* admins can control cloud routes and retention
* analytics avoid exposing transcript content unnecessarily

## Phase 6 - Enterprise

Goal:

* support organizations with strict security, compliance, and deployment needs

Scope:

* SSO/SAML/SCIM-ready architecture
* audit logs
* retention controls
* private deployment
* subprocessor documentation
* dedicated model routing

Exit criteria:

* hosted and private deployments have clear data boundaries
* enterprise controls are documented and testable
* compliance features monetize without weakening local-first defaults

## Non-Goals

Do not prioritize:

* generic chatbot features
* generic meeting transcription
* social or community features
* provider count for its own sake
* UI polish before the dictation pipeline works
* cloud-only workflows that make local mode second-class
