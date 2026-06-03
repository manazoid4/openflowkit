import { useCallback, useEffect, useState } from "react";
import type { DictationRecord } from "../core/types";

const STORAGE_KEY = "openflow:history";
const MAX_RECORDS = 100;

function loadHistory(): DictationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DictationRecord[]) : [];
  } catch {
    return [];
  }
}

export function useHistory() {
  const [history, setHistory] = useState<DictationRecord[]>(loadHistory);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_RECORDS)));
    } catch {
      // ignore quota errors
    }
  }, [history]);

  const addRecord = useCallback((record: DictationRecord) => {
    setHistory((prev) => [record, ...prev].slice(0, MAX_RECORDS));
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setHistory((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return { history, addRecord, deleteRecord, clearHistory };
}
