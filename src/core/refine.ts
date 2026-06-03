import type { DictationContext, RefinementResult, TranscriptionResult } from "./types";

const fillerPattern = /\b(um+|uh+|erm+|ah+|like|you know|sort of|kind of|i mean|basically|literally|actually)\b[,\s]*/gi;

const selfCorrectionPattern = /\b(.{0,60}?)\s+(?:no\s+(wait|sorry|actually)|scratch\s+that|i\s+mean)\s*,?\s*(.{0,120})\b/gi;

const repeatedWordPattern = /\b(\w+)\s+\1\b/gi;

export function deterministicRefine(
  transcript: TranscriptionResult,
  context: DictationContext,
): RefinementResult {
  let text = transcript.rawText.trim().replace(/\s+/g, " ");
  const actions: string[] = [];

  // Step 1: Remove filler words
  const withoutFillers = text.replace(fillerPattern, "");
  if (withoutFillers !== text) {
    text = withoutFillers;
    actions.push("removed fillers");
  }

  // Step 2: Resolve self-corrections (keep the corrected part)
  const corrected = text.replace(selfCorrectionPattern, (_match, _before, _marker, after) => after.trim());
  if (corrected !== text) {
    text = corrected;
    actions.push("resolved spoken correction");
  }

  // Step 3: Remove repeated words
  const deduped = text.replace(repeatedWordPattern, "$1");
  if (deduped !== text) {
    text = deduped;
    actions.push("deduplicated words");
  }

  // Step 4: Mode-specific formatting
  if (context.mode === "code") {
    text = text
      .replace(/\bsnake case\b/gi, "snake_case")
      .replace(/\bcamel case\b/gi, "camelCase")
      .replace(/\bkebab case\b/gi, "kebab-case")
      .replace(/\bnew line\b/gi, "\n")
      .replace(/\bsemicolon\b/gi, ";")
      .replace(/\bopen bracket\b/gi, "(")
      .replace(/\bclose bracket\b/gi, ")")
      .replace(/\bopen curly\b/gi, "{")
      .replace(/\bclose curly\b/gi, "}");
    actions.push("applied developer formatting");
  }

  if (context.mode === "message") {
    // Slack/Discord style: lowercase start, no terminal period for short messages
    if (text.length < 120 && !text.includes("\n")) {
      text = text.charAt(0).toLowerCase() + text.slice(1);
      actions.push("applied message style");
    }
  }

  if (context.mode === "document") {
    text = text
      .replace(/\bnew paragraph\b/gi, "\n\n")
      .replace(/\bbullet point\b/gi, "\n- ")
      .replace(/\bnumbered list\b/gi, "\n1. ");
    actions.push("applied document formatting");
  }

  // Step 5: Snippet expansion
  for (const [cue, expansion] of Object.entries(context.snippets ?? {})) {
    const next = text.replace(new RegExp(`\\b${escapeRegExp(cue)}\\b`, "gi"), expansion);
    if (next !== text) {
      text = next;
      actions.push(`expanded snippet: ${cue}`);
    }
  }

  // Step 6: Style adaptation
  if (context.style === "concise") {
    text = text.replace(/\b(in order to|due to the fact that|at this point in time)\b/gi, (_m, phrase) => {
      const replacements: Record<string, string> = {
        "in order to": "to",
        "due to the fact that": "because",
        "at this point in time": "now",
      };
      return replacements[phrase.toLowerCase()] ?? phrase;
    });
    actions.push("applied concise style");
  }

  if (context.style === "formal") {
    text = text.replace(/\b(don't|can't|won't|isn't|aren't|haven't|hasn't|wasn't|weren't)\b/gi, (_m, word) => {
      const formalMap: Record<string, string> = {
        "don't": "do not",
        "can't": "cannot",
        "won't": "will not",
        "isn't": "is not",
        "aren't": "are not",
        "haven't": "have not",
        "hasn't": "has not",
        "wasn't": "was not",
        "weren't": "were not",
      };
      return formalMap[word.toLowerCase()] ?? word;
    });
    actions.push("applied formal style");
  }

  // Step 7: Terminal punctuation (respect existing punctuation)
  text = text.trim();
  if (text && !/[.!?\n]$/.test(text) && context.mode !== "message") {
    text += ".";
    actions.push("added terminal punctuation");
  }

  // Step 8: Capitalise first letter of sentences (skip for message mode)
  if (context.mode !== "message") {
    text = text.replace(/(^.|[.!?]\s+\w)/g, (m) => m.toUpperCase());
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
