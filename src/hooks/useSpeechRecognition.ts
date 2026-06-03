import { useCallback, useEffect, useRef, useState } from "react";

export type RecordingState = "idle" | "recording" | "processing" | "error" | "unsupported";

export interface UseSpeechRecognitionResult {
  state: RecordingState;
  interimTranscript: string;
  finalTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

const getSR = (): SpeechRecognitionConstructor | null => {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
};

export function useSpeechRecognition(language = "en-US"): UseSpeechRecognitionResult {
  const SR = getSR();
  const [state, setState] = useState<RecordingState>(SR ? "idle" : "unsupported");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const accumulatedRef = useRef("");
  const hadErrorRef = useRef(false);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      setState("processing");
      recognitionRef.current.stop();
    }
  }, []);

  const start = useCallback(() => {
    if (!SR) return;
    accumulatedRef.current = "";
    hadErrorRef.current = false;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState("recording");
      setError(null);
    };

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          accumulatedRef.current += r[0].transcript;
        } else {
          interim += r[0].transcript;
        }
      }
      setFinalTranscript(accumulatedRef.current);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      hadErrorRef.current = true;
      setState("error");
      setError(event.error);
    };

    recognition.onend = () => {
      if (!hadErrorRef.current) setState("idle");
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [SR, language]);

  const reset = useCallback(() => {
    accumulatedRef.current = "";
    hadErrorRef.current = false;
    setFinalTranscript("");
    setInterimTranscript("");
    setError(null);
    setState("idle");
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return { state, interimTranscript, finalTranscript, error, start, stop, reset };
}
