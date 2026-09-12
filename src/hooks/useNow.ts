import { useEffect, useState } from 'react';

/** Current time, re-rendering every `intervalMs` while `active`. Timers derive from timestamps so backgrounding can't pause them. */
export function useNow(active: boolean, intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);

  return now;
}
