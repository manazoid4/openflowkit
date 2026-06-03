import React, { useCallback, useEffect, useRef, useState } from "react";
import { DictationPipeline } from "../core/dictation";
import type { DictationContext, DictationResult, DictationStatus } from "../core/types";

interface VoiceCaptureProps {
  context: DictationContext;
  onResult?: (result: DictationResult) => void;
  onStatusChange?: (status: DictationStatus) => void;
}

export const VoiceCapture: React.FC<VoiceCaptureProps> = ({ context, onResult, onStatusChange }) => {
  const [status, setStatus] = useState<DictationStatus>("idle");
  const [interim, setInterim] = useState("");
  const [final, setFinal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<DictationResult[]>([]);
  const pipelineRef = useRef<DictationPipeline | null>(null);

  const ensurePipeline = useCallback(() => {
    if (!pipelineRef.current) {
      pipelineRef.current = new DictationPipeline({
        context,
        onStatusChange: (s) => {
          setStatus(s);
          onStatusChange?.(s);
        },
        onInterim: (text) => setInterim(text),
      });
      pipelineRef.current.subscribeToCapture((i, f) => {
        setInterim(i);
        setFinal(f);
      });
    }
    return pipelineRef.current;
  }, [context, onStatusChange]);

  useEffect(() => {
    return () => {
      pipelineRef.current?.abort();
      pipelineRef.current = null;
    };
  }, []);

  const handleToggle = async () => {
    setError(null);
    if (status === "capturing") {
      const pipeline = ensurePipeline();
      const result = await pipeline.stop();
      if (result) {
        setHistory((prev) => [result, ...prev]);
        onResult?.(result);
      }
    } else {
      const pipeline = ensurePipeline();
      const started = await pipeline.start();
      if (!started) {
        setError("Microphone access denied or SpeechRecognition unsupported.");
      }
    }
  };

  const handleAbort = () => {
    pipelineRef.current?.abort();
    setInterim("");
    setFinal("");
    setStatus("idle");
  };

  const isRecording = status === "capturing";
  const statusLabel =
    status === "idle"
      ? "Ready"
      : status === "capturing"
        ? "Listening..."
        : status === "transcribing"
          ? "Transcribing..."
          : status === "refining"
            ? "Refining..."
            : status === "completed"
              ? "Done"
              : status === "error"
                ? "Error"
                : status;

  return (
    <div className="voiceCapture" aria-label="Voice capture">
      <div className="captureControls">
        <button
          className={`recordButton ${isRecording ? "recording" : ""}`}
          onClick={handleToggle}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
          type="button"
        >
          {isRecording ? "Stop" : "Push to Talk"}
        </button>
        {isRecording && (
          <button className="button ghost" onClick={handleAbort} type="button">
            Cancel
          </button>
        )}
      </div>

      <div className="statusBar">
        <span className={`statusDot ${status}`} aria-hidden="true" />
        <span className="statusLabel">{statusLabel}</span>
        {status !== "idle" && status !== "error" && (
          <span className="latencyHint">Hold spacebar or click to toggle</span>
        )}
      </div>

      {error && (
        <div className="captureError" role="alert">
          {error}
        </div>
      )}

      <div className="transcriptDisplay">
        {interim && <span className="interim">{interim}</span>}
        {final && <span className="final">{final}</span>}
        {!interim && !final && status === "idle" && (
          <span className="placeholder">Press the button and speak naturally...</span>
        )}
      </div>

      {history.length > 0 && (
        <div className="historyPanel">
          <h4>History</h4>
          <ul>
            {history.slice(0, 10).map((item) => (
              <li key={item.id}>
                <p className="refined">{item.refinedText}</p>
                <p className="meta">
                  {item.latencyMs}ms · {item.confidence > 0 ? `${Math.round(item.confidence * 100)}%` : "?"} confidence ·{" "}
                  {item.actions.slice(0, 3).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
