import React, { useCallback, useEffect, useRef, useState } from "react";
import type { TerminalBridgeMessage } from "../core/types";

interface TerminalBridgeProps {
  wsUrl?: string;
  onDictation?: (text: string) => void;
}

export const TerminalBridge: React.FC<TerminalBridgeProps> = ({ wsUrl = "ws://localhost:8765", onDictation }) => {
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [commandMode, setCommandMode] = useState(false);
  const [inputText, setInputText] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number>(0);

  const addLog = useCallback((line: string) => {
    setLogs((prev) => [line, ...prev].slice(0, 50));
  }, []);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        setConnected(true);
        addLog("[connected] Terminal bridge ready");
        reconnectRef.current = 0;
      };
      ws.onmessage = (event) => {
        try {
          const msg: TerminalBridgeMessage = JSON.parse(event.data);
          if (msg.type === "dictation") {
            addLog(`[dictation] ${msg.payload.slice(0, 120)}`);
            onDictation?.(msg.payload);
          } else if (msg.type === "pong") {
            addLog("[pong]");
          } else {
            addLog(`[${msg.type}] ${msg.payload.slice(0, 120)}`);
          }
        } catch {
          addLog(`[raw] ${event.data.slice(0, 120)}`);
        }
      };
      ws.onclose = () => {
        setConnected(false);
        addLog("[disconnected] Reconnecting...");
        const delay = Math.min(1000 * 2 ** reconnectRef.current, 30000);
        reconnectRef.current += 1;
        setTimeout(() => connect(), delay);
      };
      ws.onerror = () => {
        addLog("[error] WebSocket error");
      };
      wsRef.current = ws;
    } catch {
      addLog("[error] Failed to create WebSocket");
    }
  }, [wsUrl, addLog, onDictation]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  const sendCommand = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addLog("[error] Not connected");
      return;
    }
    const msg: TerminalBridgeMessage = {
      type: "command",
      payload: inputText,
      timestamp: Date.now(),
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    wsRef.current.send(JSON.stringify(msg));
    addLog(`[sent] ${inputText}`);
    setInputText("");
  };

  const sendPing = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const msg: TerminalBridgeMessage = {
      type: "ping",
      payload: "ping",
      timestamp: Date.now(),
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    wsRef.current.send(JSON.stringify(msg));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addLog("[clipboard] Copied to clipboard");
    } catch {
      addLog("[clipboard] Failed to copy");
    }
  };

  return (
    <div className="terminalBridge" aria-label="Terminal bridge">
      <div className="bridgeHeader">
        <span className={`connectionDot ${connected ? "online" : "offline"}`} aria-hidden="true" />
        <span className="connectionLabel">{connected ? "Bridge Online" : "Bridge Offline"}</span>
        <button className="button small" onClick={sendPing} disabled={!connected} type="button">
          Ping
        </button>
      </div>

      <div className="bridgeBody">
        <div className="logPanel">
          {logs.length === 0 && <span className="placeholder">Waiting for connection...</span>}
          {logs.map((line, i) => (
            <div key={i} className="logLine">
              {line}
            </div>
          ))}
        </div>

        <div className="commandBar">
          <button
            className={`button small ${commandMode ? "active" : ""}`}
            onClick={() => setCommandMode((v) => !v)}
            type="button"
          >
            Command Mode
          </button>
          <button
            className="button small secondary"
            onClick={() => copyToClipboard(logs.find((l) => l.startsWith("[dictation]"))?.replace("[dictation] ", "") ?? "")}
            type="button"
          >
            Copy Last
          </button>
        </div>

        {commandMode && (
          <div className="commandInput">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendCommand();
              }}
              placeholder="Say: make it formal, bullet points, shorter..."
              aria-label="Command input"
            />
            <button className="button" onClick={sendCommand} type="button">
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
