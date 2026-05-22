"use client";

import { useEffect, useState } from "react";

const FRAMES = [
  "/loading/frame-1.svg",
  "/loading/frame-2.svg",
  "/loading/frame-3.svg",
  "/loading/frame-4.svg",
];

const FRAME_MS = 500;
const FRAME_STEPS = 8;
const HOLD_MS = 1000;
const FADE_MS = 500;

export default function LoadingScreen() {
  const [step, setStep] = useState(0);
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const interval = setInterval(() => {
      setStep((s) => {
        if (s >= FRAME_STEPS - 1) {
          clearInterval(interval);
          return s;
        }
        return s + 1;
      });
    }, FRAME_MS);

    const fadeTimer = setTimeout(() => setFading(true), FRAME_MS * FRAME_STEPS + HOLD_MS);
    const hideTimer = setTimeout(() => {
      setHidden(true);
      document.body.style.overflow = original;
    }, FRAME_MS * FRAME_STEPS + HOLD_MS + FADE_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
      document.body.style.overflow = original;
    };
  }, []);

  if (hidden) return null;

  const frame = FRAMES[step % FRAMES.length];

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        background: "#ffaa00",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <img
        src={frame}
        alt=""
        style={{
          width: "min(80vw, 900px)",
          height: "auto",
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}
