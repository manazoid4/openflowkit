import type { DictationContext, RefinementResult, TranscriptionResult } from "./types";

const fillerPattern = /\b(um+|uh+|erm+|ah+|like|you know)\b[,\s]*/gi;

const CONTRACTIONS: Record<string, string> = {
  "won't": "will not", "can't": "cannot", "don't": "do not",
  "doesn't": "does not", "didn't": "did not", "isn't": "is not",
  "aren't": "are not", "wasn't": "was not", "weren't": "were not",
  "haven't": "have not", "hasn't": "has not", "hadn't": "had not",
  "wouldn't": "would not", "shouldn't": "should not", "couldn't": "could not",
  "I'm": "I am", "I've": "I have", "I'll": "I will", "I'd": "I would",
  "we're": "we are", "they're": "they are", "it's": "it is",
  "that's": "that is", "there's": "there is",
};

function capitalizeFirst(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function expandContractions(text: string): string {
  let result = text;
  for (const [form, expansion] of Object.entries(CONTRACTIONS)) {
    result = result.replace(new RegExp(`\\b${escapeRegExp(form)}\\b`, "gi"), expansion);
  }
  return result;
}

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

  if (context.mode === "code" || context.mode === "command") {
    text = text
      .replace(/\bsnake case\b/gi, "snake_case")
      .replace(/\bcamel case\b/gi, "camelCase")
      .replace(/\bnew line\b/gi, "\n");
    actions.push("applied developer formatting");
  }

  if (context.mode === "formal" || context.mode === "document") {
    const expanded = expandContractions(text);
    if (expanded !== text) {
      text = expanded;
      actions.push("expanded contractions");
    }
    text = capitalizeFirst(text);
    actions.push("formal tone applied");
  }

  if (context.mode === "email") {
    text = capitalizeFirst(text);
    actions.push("email formatting applied");
  }

  if (context.mode === "slack" || context.mode === "casual" || context.mode === "message") {
    text = capitalizeFirst(text);
    actions.push("chat tone applied");
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
