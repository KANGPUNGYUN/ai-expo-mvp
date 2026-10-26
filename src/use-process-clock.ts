import { useEffect, useRef, useState } from "react";
import { CYCLE_SECONDS } from "./process-cycle";
export function useProcessClock(active: boolean, speed: number, identity: string, sequence: boolean, onNext: () => void) {
  const clock = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => { clock.current = 0; setElapsed(0); }, [identity]);
  useEffect(() => {
    if (!active) return;
    let frame = 0, previous = performance.now(), lastUI = 0;
    const tick = (now: number) => {
      clock.current += Math.min((now - previous) / 1000, .08) * speed;
      previous = now;
      if (clock.current >= CYCLE_SECONDS) {
        clock.current %= CYCLE_SECONDS;
        if (sequence) { onNext(); return; }
      }
      if (now - lastUI > 70) { setElapsed(clock.current); lastUI = now; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, speed, identity, sequence, onNext]);
  const seek = (value: number) => { clock.current=value; setElapsed(value); };
  return { clock, elapsed, seek };
}
