# Architecture

OpenFlowKit uses a modular pipeline:

```text
CAPTURE -> TRANSCRIBE -> REFINE -> PERSONALIZE -> INJECT -> SYNC
```

## Modules

Capture:

- desktop hotkey
- microphone stream
- optional active app metadata
- optional selected text/context with explicit consent

Transcribe:

- local Whisper, Parakeet, Moonshine, or Vosk
- cloud Deepgram, Groq, OpenAI, AssemblyAI, Gladia, ElevenLabs, or compatible provider
- output structured transcript segments with latency and confidence metadata

Refine:

- filler removal
- backtrack correction
- punctuation
- list formatting
- style transformation
- code and CLI formatting

Personalize:

- personal dictionary
- shared dictionary
- snippets
- app-specific style rules

Inject:

- paste into active text field
- preserve clipboard
- support command mode for transformations

Sync:

- local-first storage by default
- optional hosted sync
- team policies and audit logs on paid plans

## Provider design

Providers must be swappable. The core should accept OpenAI-compatible LLM endpoints so users can route through Ollama, OpenRouter, vLLM, LiteLLM, LM Studio, or hosted APIs without changing app code.

## Privacy defaults

- Privacy mode defaults to on.
- No dictation storage unless explicitly enabled.
- App context is opt-in and scoped.
- Local model routes should work without an internet connection.
- Hosted plans should publish subprocessors and retention controls.

