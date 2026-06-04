import { useCallback, useEffect, useRef, useState } from "react";

const BRIDGE_URL = "http://127.0.0.1:7373";

export interface TerminalBridgeState {
  connected: boolean;
  injecting: boolean;
  lastError: string | null;
}

export interface UseTerminalBridgeResult extends TerminalBridgeState {
  send: (text: string, action?: "clipboard" | "type") => Promise<void>;
}

export function useTerminalBridge(): UseTerminalBridgeResult {
  const [connected, setConnected] = useState(false);
  const [injecting, setInjecting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${BRIDGE_URL}/health`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        setConnected(true);
        setLastError(null);
        return;
      }
    } catch {
      // ignore
    }
    setConnected(false);
  }, []);

  useEffect(() => {
    checkHealth();
    intervalRef.current = setInterval(checkHealth, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkHealth]);

  const send = useCallback(
    async (text: string, action: "clipboard" | "type" = "clipboard") => {
      if (!text) return;
      setInjecting(true);
      setLastError(null);
      try {
        const res = await fetch(`${BRIDGE_URL}/inject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, action }),
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || `HTTP ${res.status}`);
        }
      } catch (e: any) {
        setLastError(e.message || "Bridge unreachable");
        setConnected(false);
      } finally {
        setInjecting(false);
      }
    },
    []
  );

  return { connected, injecting, lastError, send };
}
