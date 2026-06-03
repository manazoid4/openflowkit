# OpenFlowKit Prompting Guide

## Purpose

Prompts in OpenFlowKit exist to refine dictated speech into usable text. They must not carry product logic that belongs in code, provider routing, privacy policy, or deterministic formatting rules.

The product should stay LLM agnostic. A prompt that only works with one provider is a weak prompt.

---

## Prompt Priorities

1. Preserve the speaker's intent
2. Remove filler, false starts, and backtracking
3. Add punctuation, paragraphing, and list structure
4. Respect dictionaries, snippets, and style profiles
5. Format for the active app or task
6. Keep latency and token use low

Never rewrite beyond the requested mode.

---

## Core Refinement Contract

Every refinement prompt should receive structured input:

* rawTranscript
* language
* mode
* targetApp
* selectedText
* dictionaryTerms
* snippets
* styleProfile
* privacyMode

Every refinement response should return structured output:

* refinedText
* detectedIntent
* appliedRules
* unresolvedTerms
* confidence
* status

No placeholder text. No fake confidence. No provider-specific assumptions.

---

## Modes

Dictation:

* clean speech into ready-to-insert prose
* preserve meaning and tone
* do not add new claims

Command:

* transform selected text or follow a spoken edit instruction
* return only the requested result unless metadata is required by the caller

Developer:

* preserve code symbols, filenames, CLI commands, casing, acronyms, and indentation intent
* prefer deterministic syntax rules before model creativity

Message:

* make the text clear and sendable
* preserve the user's level of directness
* avoid corporate padding

---

## Good Prompt Shape

Use short, explicit instructions:

```text
You refine dictated speech into ready-to-paste text.
Preserve the user's intent.
Remove filler words, false starts, and backtracking.
Apply the supplied dictionary and style profile.
Return structured JSON matching the schema.
```

Avoid long persona prompts, hidden business logic, and provider-specific wording.

---

## Privacy Rules

Prompts must not request more context than needed.

If privacyMode is true:

* do not include app context unless explicitly supplied
* do not ask the model to infer private information
* do not retain transcript content in prompt logs
* prefer local or BYOK routes

---

## SaaS Gating Rules

Free routes may use:

* local STT
* BYOK LLM endpoints
* local dictionaries
* local snippets

Paid routes may add:

* managed STT
* managed LLM cleanup
* team dictionaries
* shared snippets
* synced style profiles
* admin policy and audit metadata

Prompts must not implement paywalls. Product code should gate provider access, sync, policy, and analytics.

---

## Anti-Patterns

Do not:

* ask the model to decide pricing tiers
* ask the model to choose cloud routing for sensitive text
* hide retention or analytics behavior inside prompts
* use chain-of-thought style instructions
* add speculative facts to dictated content
* turn all dictation into marketing copy
* make UI copy pretend a provider route is local when it is not

---

## Evaluation Checklist

A refinement prompt is acceptable when:

* the output is ready to paste
* intent is preserved
* latency is low enough for interactive dictation
* dictionary terms are respected
* app-specific formatting is correct
* privacy mode changes what context is sent
* the same contract can run through multiple model providers
