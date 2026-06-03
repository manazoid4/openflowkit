import type { DictationContext, RefinementResult, TranscriptionResult } from "./types";

const fillerPattern = /\b(um+|uh+|erm+|ah+|like|you know)\b[,\s]*/gi;

export function deterministicRefine(
  transcript: TranscriptionResult,
  context: DictationContext,
): RefinementResult {
  let text = transcript.rawText.trim().replace(/\s+/g, " ");
  const actions: string[] = [];

  const withoutFillers = text.replace(fillerPattern, "");
  if (withoutFillers !== text) {
    text = withoutFillers;
    actions.push("removed fillers");
  }

  const backtrack = text.replace(/\b(.{1,80}?)\s+(actually|sorry),?\s+/gi, "");
  if (backtrack !== text) {
    text = backtrack;
    actions.push("resolved spoken correction");
  }

  if (context.mode === "code") {
    text = text
      .replace(/\bsnake case\b/gi, "snake_case")
      .replace(/\bcamel case\b/gi, "camelCase")
      .replace(/\bnew line\b/gi, "\n");
    actions.push("applied developer formatting");
  }

  for (const [cue, expansion] of Object.entries(context.snippets ?? {})) {
    const next = text.replace(new RegExp(`\\b${escapeRegExp(cue)}\\b`, "gi"), expansion);
    if (next !== text) {
      text = next;
      actions.push(`expanded snippet: ${cue}`);
    }
  }

  if (text && !/[.!?\n]$/.test(text)) {
    text += ".";
    actions.push("added terminal punctuation");
  }

  return {
    provider: "deterministic-local",
    text,
    actions,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
