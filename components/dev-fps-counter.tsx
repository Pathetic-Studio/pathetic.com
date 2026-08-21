"use client";

import { useEffect, useRef } from "react";

export default function DevFpsCounter() {
  const outputRef = useRef<HTMLOutputElement | null>(null);

  useEffect(() => {
    let frame = 0;
    let frames = 0;
    let measuredAt = performance.now();

    const measure = (now: number) => {
      frame = requestAnimationFrame(measure);
      frames += 1;

      const elapsed = now - measuredAt;
      if (elapsed < 500) return;

      if (outputRef.current) {
        outputRef.current.textContent = `FPS: ${Math.round((frames * 1000) / elapsed)}`;
      }
      frames = 0;
      measuredAt = now;
    };

    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <output
      ref={outputRef}
      style={{ position: "fixed", left: 0, top: 0, zIndex: 2147483647 }}
    >
      FPS: --
    </output>
  );
}
