// A tiny in-memory pub/sub used instead of a full data-fetching library
// (there's no remote API to cache — everything lives in localStorage via
// src/api/db.js). Call `invalidate()` after any write so screens refresh.
import { useEffect, useState, useCallback } from "react";

const listeners = new Set();

export function invalidate() {
  listeners.forEach((fn) => fn());
}

export function useLiveQuery(queryFn, deps = []) {
  const [data, setData] = useState(() => queryFn());
  const [version, setVersion] = useState(0);

  const run = useCallback(() => setData(queryFn()), deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    run();
  }, [run, version]);

  useEffect(() => {
    const listener = () => setVersion((v) => v + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  return [data, run];
}
