import React, { useCallback, useEffect, useRef, useState } from "react";
import { deterministicRefine } from "../core/refine";
import { WRITING_MODES, writingModeLabels, writingModeToContext, isProMode, modeTier } from "../core/writingModes";
import type { WritingMode } from "../core/writingModes";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useHistory } from "../hooks/useHistory";
import { useTerminalBridge } from "../hooks/useTerminalBridge";
import type { DictationRecord } from "../core/types";
import { UpgradePrompt } from "./UpgradePrompt";

const LANGUAGES = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "es-ES", label: "Spanish" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "it-IT", label: "Italian" },
  { code: "pt-BR", label: "Portuguese" },
  { code: "ja-JP", label: "Japanese" },
  { code: "zh-CN", label: "Chinese" },
  { code: "ar-SA", label: "Arabic" },
];

function buildShareUrl(text: string): string {
  const encoded = btoa(encodeURIComponent(text));
  return `${window.location.origin}${window.location.pathname}#share?t=${encoded}`;
}

interface Props {
  onBack: () => void;
}

export function DictationLab({ onBack }: Props) {
  const [mode, setMode] = useState<WritingMode>("email");
  const [language, setLanguage] = useState("en-US");
  const [privacyMode, setPrivacyMode] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [refinedText, setRefinedText] = useState("");
  const [refinedActions, setRefinedActions] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [sharedLink, setSharedLink] = useState("");
  const [proPromptMode, setProPromptMode] = useState<WritingMode | null>(null);

  const { state, interimTranscript, finalTranscript, error, start, stop, reset } =
    useSpeechRecognition(language);
  const { history, addRecord, clearHistory, deleteRecord } = useHistory();
  const { connected: bridgeConnected, injecting: bridgeInjecting, lastError: bridgeError, send: sendToBridge } = useTerminalBridge();
  const startTimeRef = useRef(0);
  const prevFinalRef = useRef("");

  const handleToggle = useCallback(() => {
    if (state === "recording") {
      stop();
    } else if (state === "idle") {
      startTimeRef.current = Date.now();
      prevFinalRef.current = "";
      reset();
      setRefinedText("");
      setRefinedActions([]);
      setSharedLink("");
      start();
    }
  }, [state, start, stop, reset]);

  useEffect(() => {
    if (state === "idle" && finalTranscript && finalTranscript !== prevFinalRef.current) {
      prevFinalRef.current = finalTranscript;
      const ctx = writingModeToContext(mode, privacyMode);
      const transcript = {
        provider: "web-speech",
        rawText: finalTranscript,
        segments: [],
        latencyMs: Date.now() - startTimeRef.current,
      };
      const result = deterministicRefine(transcript, ctx);
      setRefinedText(result.text);
      setRefinedActions(result.actions);

      const record: DictationRecord = {
        id: crypto.randomUUID(),
        rawTranscript: finalTranscript,
        refinedText: result.text,
        language,
        mode,
        providerRoute: "web-speech/deterministic-local",
        latencyMs: transcript.latencyMs,
        confidence: 0.9,
        privacyMode,
        appContext: null,
        status: "complete",
        createdAt: Date.now(),
      };
      addRecord(record);
    }
  }, [state, finalTranscript, mode, privacyMode, language, addRecord]);

  const handleCopy = useCallback(async () => {
    const text = refinedText || finalTranscript;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [refinedText, finalTranscript]);

  const handleShare = useCallback(async () => {
    const text = refinedText || finalTranscript;
    if (!text) return;
    const url = buildShareUrl(text);
    await navigator.clipboard.writeText(url);
    setSharedLink(url);
  }, [refinedText, finalTranscript]);

  const handleSendToTerminal = useCallback(async () => {
    const text = refinedText || finalTranscript;
    if (!text) return;
    await sendToBridge(text, "clipboard");
  }, [refinedText, finalTranscript, sendToBridge]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        handleToggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleToggle]);

  const isRecording = state === "recording";
  const isUnsupported = state === "unsupported";
  const liveTranscript = isRecording
    ? (finalTranscript + " " + interimTranscript).trim()
    : finalTranscript;

  return (
    <div className="lab">
      <header className="labHeader">
        <button className="labBack" onClick={onBack} aria-label="Back to home">
          ← Back
        </button>
        <nav className="modeSelector" aria-label="Writing mode">
          {WRITING_MODES.map((m) => {
            const pro = isProMode(m);
            return (
              <button
                key={m}
                className={`modeChip${mode === m ? " active" : ""}${pro ? " proMode" : ""}`}
                onClick={() => {
                  if (pro) {
                    setProPromptMode(m);
                  } else {
                    setMode(m);
                  }
                }}
                aria-pressed={mode === m && !pro}
              >
                {writingModeLabels[m]}{pro ? " ✦" : ""}
              </button>
            );
          })}
        </nav>
        <div className="labControls">
          <select
            className="langSelect"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Language"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <button
            className={`privacyToggle${privacyMode ? " on" : " off"}`}
            onClick={() => setPrivacyMode((p) => !p)}
            title={privacyMode ? "Local processing only" : "Cloud routing enabled"}
          >
            {privacyMode ? "Local" : "Cloud"}
          </button>
          <button
            className="historyBtn"
            onClick={() => setShowHistory((v) => !v)}
            aria-expanded={showHistory}
          >
            History{history.length > 0 ? ` (${history.length})` : ""}
          </button>
          <span
            className={`bridgeStatus${bridgeConnected ? " on" : ""}`}
            title={bridgeConnected ? "Terminal bridge connected" : "Terminal bridge offline — run node bridge/server.ts"}
          >
            {bridgeConnected ? "Bridge" : "No bridge"}
          </span>
        </div>
      </header>

      <div className="recordingZone">
        {isUnsupported ? (
          <div className="unsupportedMsg" role="alert">
            <p className="unsupportedTitle">Voice not available in this browser</p>
            <p>Use Chrome, Edge, or Safari for voice capture.</p>
          </div>
        ) : (
          <>
            <button
              className={`micButton${isRecording ? " recording" : ""}`}
              onClick={handleToggle}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              <span className="micIcon">{isRecording ? "■" : "●"}</span>
              <span className="micLabel">{isRecording ? "Stop" : "Record"}</span>
            </button>

            {isRecording && (
              <div className="waveform" aria-hidden="true">
                {Array.from({ length: 12 }, (_, i) => (
                  <span key={i} style={{ animationDelay: `${(i * 0.07).toFixed(2)}s` }} />
                ))}
              </div>
            )}

            <p className="statusLabel">
              {state === "recording" && "Listening — Space or click to stop"}
              {state === "idle" && !finalTranscript && "Space or click to start"}
              {state === "idle" && finalTranscript && "Done — record again or edit"}
              {state === "processing" && "Finishing up…"}
              {state === "error" && (
                <span className="statusError">
                  {error === "not-allowed"
                    ? "Microphone permission denied"
                    : `Error: ${error}`}
                </span>
              )}
            </p>
          </>
        )}
      </div>

      {isUnsupported && (
        <div className="manualInput">
          <label htmlFor="manualText">Paste or type your text</label>
          <textarea
            id="manualText"
            rows={4}
            placeholder="Paste text here, choose a mode above, then click outside to refine."
            onBlur={(e) => {
              const val = e.target.value.trim();
              if (!val) return;
              const ctx = writingModeToContext(mode, privacyMode);
              const result = deterministicRefine(
                { provider: "manual", rawText: val, segments: [], latencyMs: 0 },
                ctx,
              );
              setRefinedText(result.text);
              setRefinedActions(result.actions);
            }}
          />
        </div>
      )}

      {(liveTranscript || refinedText) && (
        <div className="labPanels">
          <div className="labPanel">
            <div className="panelLabel">Raw transcript</div>
            <div className="labTranscript" aria-live="polite">
              {finalTranscript && (
                <span className="transcriptFinal">{finalTranscript}</span>
              )}
              {interimTranscript && (
                <span className="transcriptInterim"> {interimTranscript}</span>
              )}
            </div>
          </div>

          {refinedText && (
            <div className="labPanel refined">
              <div className="panelLabelRow">
                <span className="panelLabel">Polished · {writingModeLabels[mode]}</span>
                <button className="copyBtn" onClick={handleCopy}>
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="labRefined">{refinedText}</div>
              {refinedActions.length > 0 && (
                <div className="chips">
                  {refinedActions.map((a) => (
                    <span key={a}>{a}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {(liveTranscript || refinedText) && (
        <div className="labActions">
          <button
            className="button secondary"
            onClick={() => {
              reset();
              setRefinedText("");
              setRefinedActions([]);
              setSharedLink("");
            }}
          >
            Clear
          </button>
          {refinedText && (
            <button className="button secondary" onClick={handleShare}>
              {sharedLink ? "Link copied!" : "Share link"}
            </button>
          )}
          {refinedText && (
            <button
              className="button secondary"
              onClick={handleSendToTerminal}
              disabled={bridgeInjecting}
            >
              {bridgeInjecting ? "Sending…" : bridgeConnected ? "Send to terminal" : "Bridge offline"}
            </button>
          )}
        </div>
      )}

      {bridgeError && (
        <div className="bridgeError" role="alert">
          Bridge error: {bridgeError}
        </div>
      )}

      {sharedLink && (
        <div className="shareNotice" role="status">
          Share link copied to clipboard.
        </div>
      )}

      {showHistory && (
        <>
          <div
            className="historyOverlay"
            onClick={() => setShowHistory(false)}
            aria-hidden="true"
          />
          <aside className="historySidebar" aria-label="Recording history">
            <div className="historyHeader">
              <span>History</span>
              {history.length > 0 && (
                <button onClick={clearHistory} className="historyClearBtn">
                  Clear all
                </button>
              )}
              <button onClick={() => setShowHistory(false)} aria-label="Close history">
                ✕
              </button>
            </div>
            {history.length === 0 ? (
              <p className="historyEmpty">No recordings yet.</p>
            ) : (
              history.map((record) => (
                <div
                  key={record.id}
                  className="historyItem"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setRefinedText(record.refinedText);
                    setShowHistory(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setRefinedText(record.refinedText);
                      setShowHistory(false);
                    }
                  }}
                >
                  <div className="historyMeta">
                    <span className="historyMode">{record.mode}</span>
                    <span className="historyTime">
                      {new Date(record.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <button
                      className="historyDeleteBtn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRecord(record.id);
                      }}
                      aria-label="Delete"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="historyText">
                    {record.refinedText.length > 140
                      ? `${record.refinedText.slice(0, 140)}…`
                      : record.refinedText}
                  </p>
                </div>
              ))
            )}
          </aside>
        </>
      )}

      {proPromptMode && (
        <UpgradePrompt
          mode={proPromptMode}
          onClose={() => setProPromptMode(null)}
        />
      )}
    </div>
  );
}
