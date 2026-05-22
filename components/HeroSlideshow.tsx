"use client";

import { useEffect, useState } from "react";

type Props = {
  /** Photo sources to cycle through. */
  photos: { src: string; alt: string }[];
  /** Per-photo display time (ms). Default 1700. */
  photoMs?: number;
  /** Initial delay before the first rotation starts (ms). Use to stagger two slideshows. */
  startDelayMs?: number;
};

type IconRuntime = { src: string; top: string; left: string };

/**
 * Renders rotating model photos. Designed to live INSIDE a .hero-model-slot —
 * the slot's max-height/overflow rules handle sizing; this component renders
 * inline <img> elements that inherit those constraints.
 */
export default function HeroSlideshow({ photos, photoMs = 1700, startDelayMs = 0 }: Props) {
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(startDelayMs === 0);

  useEffect(() => {
    if (startDelayMs === 0) return;
    const id = setTimeout(() => setStarted(true), startDelayMs);
    return () => clearTimeout(id);
  }, [startDelayMs]);

  useEffect(() => {
    if (!started) return;
    const id = setTimeout(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, photoMs);
    return () => clearTimeout(id);
  }, [index, started, photoMs, photos.length]);

  if (!started) return null;
  const current = photos[index];

  return <img src={current.src} alt={current.alt} />;
}
