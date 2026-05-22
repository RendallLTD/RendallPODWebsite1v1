"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const HERO_FEATURES = [
  { id: "01", primary: "100% FREE", secondary: "NO CARD REQUIRED" },
  { id: "02", primary: "21 PRODUCTS", secondary: "FULLY CUSTOMIZABLE" },
  { id: "03", primary: "48H DISPATCH", secondary: "US-BASED NETWORK" },
];

const TICKER_ITEMS = [
  "US PRINT NETWORK",
  "11 NODES ACTIVE",
  "48H DISPATCH",
  "21 PRODUCTS",
  "9 CATEGORIES",
  "ZERO INVENTORY",
  "ZERO MINIMUMS",
  "100% FREE TO USE",
  "BUILT FOR SELLERS",
];

const DISPATCH_EVENTS = [
  { city: "CHICAGO", region: "IL", ago: "04:32" },
  { city: "BROOKLYN", region: "NY", ago: "11:18" },
  { city: "AUSTIN", region: "TX", ago: "18:44" },
  { city: "LOS ANGELES", region: "CA", ago: "23:09" },
  { city: "DENVER", region: "CO", ago: "31:50" },
];

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function pad(n: number, w = 2): string {
  return String(n).padStart(w, "0");
}

function tzOffset(d: Date | null): string {
  if (!d) return "";
  const off = -d.getTimezoneOffset() / 60;
  const sign = off >= 0 ? "+" : "-";
  return `${sign}${pad(Math.abs(off))}:00`;
}

function RegMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden focusable="false">
      <circle cx="16" cy="16" r="6.5" fill="none" stroke="currentColor" strokeWidth="1" />
      <line x1="16" y1="0" x2="16" y2="32" stroke="currentColor" strokeWidth="1" />
      <line x1="0" y1="16" x2="32" y2="16" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export default function HeroIndustrial() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 50);
    setNow(new Date());
    return () => clearInterval(id);
  }, []);

  const h = now ? pad(now.getHours()) : "--";
  const m = now ? pad(now.getMinutes()) : "--";
  const s = now ? pad(now.getSeconds()) : "--";
  const ms = now ? pad(now.getMilliseconds(), 3) : "---";
  const date = now
    ? `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`
    : "----.--.--";
  const dayName = now ? DAY_NAMES[now.getDay()] : "---";

  return (
    <>
      <style>{styles}</style>

      <section className="rd-root">
        {/* TOP STATUS BAR */}
        <div className="rd-statusbar">
          <span className="rd-statusbar__cell">
            <span className="rd-dot rd-dot--live" /> SYSTEM ONLINE
          </span>
          <span className="rd-statusbar__cell rd-statusbar__cell--center">
            RENDALL // PRINT-ON-DEMAND OPERATING NETWORK // v1.0
          </span>
          <span className="rd-statusbar__cell rd-statusbar__cell--right">
            {dayName} {date} {h}:{m}:{s}
          </span>
        </div>

        {/* MONUMENTAL BANNER */}
        <div className="rd-banner">
          <RegMark className="rd-reg rd-reg--tl" />
          <RegMark className="rd-reg rd-reg--tr" />
          <RegMark className="rd-reg rd-reg--bl" />
          <RegMark className="rd-reg rd-reg--br" />

          <div className="rd-banner__meta rd-banner__meta--top">
            <span>// FRAME 001</span>
            <span>BLEED 3MM</span>
            <span>CMYK · 300DPI</span>
          </div>

          <h1 className="rd-banner__h">
            <span className="rd-banner__word">IDEA</span>
            <span className="rd-banner__arrow" aria-hidden>
              <svg viewBox="0 0 100 40" preserveAspectRatio="none">
                <line x1="0" y1="20" x2="92" y2="20" stroke="currentColor" strokeWidth="3" />
                <polyline points="80,8 92,20 80,32" fill="none" stroke="currentColor" strokeWidth="3" />
              </svg>
            </span>
            <span className="rd-banner__word">INCOME</span>
          </h1>

          <div className="rd-banner__meta rd-banner__meta--bottom">
            <span>OPERATING NETWORK</span>
            <span>11 NODES // CONUS</span>
            <span>OCEANIA → AMERICAS</span>
          </div>
        </div>

        {/* HERO BODY */}
        <div className="rd-hero">
          <div className="rd-hero__left">
            <div className="rd-eyebrow">
              <span>// SECTION 01</span>
              <span className="rd-divider-v" />
              <span>HERO MODULE</span>
            </div>

            <div className="rd-wordmark">RENDALL</div>

            <h2 className="rd-headline">
              Create and sell <em>custom products</em>
            </h2>
            <p className="rd-sub">
              Print-on-demand built for sellers who ship at volume. No
              inventory. No minimums. No bullshit.
            </p>

            <ul className="rd-specs">
              {HERO_FEATURES.map((f) => (
                <li key={f.id} className="rd-spec">
                  <span className="rd-spec__id">{f.id}</span>
                  <span className="rd-spec__primary">{f.primary}</span>
                  <span className="rd-spec__secondary">{f.secondary}</span>
                </li>
              ))}
            </ul>

            <div className="rd-cta-row">
              <Link href="/signup" className="rd-cta">
                <span className="rd-cta__label">GET STARTED FOR FREE</span>
                <span className="rd-cta__arrow" aria-hidden>↗</span>
              </Link>
              <span className="rd-cta-note">NO CARD REQUIRED</span>
            </div>
          </div>

          <aside className="rd-hero__right">
            <div className="rd-clock">
              <div className="rd-clock__head">
                <span>
                  <span className="rd-dot rd-dot--live" /> LIVE
                </span>
                <span>UTC{tzOffset(now)}</span>
              </div>
              <div className="rd-clock__digits" aria-label={`${h}:${m}:${s}`}>
                <span className="rd-clock__big">{h}</span>
                <span className="rd-clock__sep">:</span>
                <span className="rd-clock__big">{m}</span>
                <span className="rd-clock__sep">:</span>
                <span className="rd-clock__big rd-clock__big--accent">{s}</span>
                <span className="rd-clock__ms">.{ms}</span>
              </div>
              <div className="rd-clock__foot">
                <span>{dayName}</span>
                <span>{date}</span>
                <span>SYSTEM_OK</span>
              </div>
            </div>

            <div className="rd-feed">
              <div className="rd-feed__head">
                <span>DISPATCH FEED</span>
                <span>
                  <span className="rd-dot rd-dot--live" />
                </span>
              </div>
              <ul className="rd-feed__list">
                {DISPATCH_EVENTS.map((e, i) => (
                  <li key={i} className="rd-feed__row">
                    <span className="rd-feed__plus">+1</span>
                    <span className="rd-feed__loc">
                      {e.city}, {e.region}
                    </span>
                    <span className="rd-feed__ago">{e.ago} AGO</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        {/* TICKER */}
        <div className="rd-ticker">
          <div className="rd-ticker__track">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rd-ticker__group" aria-hidden={i > 0}>
                {TICKER_ITEMS.map((t, j) => (
                  <span key={`${i}-${j}`} className="rd-ticker__item">
                    <span className="rd-ticker__sep">●</span>
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Manrope:wght@400;500;700;800;900&family=Major+Mono+Display&display=swap');

.rd-root {
  --ink: #0A0A0A;
  --paper: #FFFFFF;
  --g100: #F5F5F5;
  --g200: #E5E5E5;
  --g300: #D4D4D4;
  --g400: #A3A3A3;
  --g500: #737373;
  --g600: #525252;
  --g700: #404040;
  --accent: #FF5C35;

  background: var(--paper);
  color: var(--ink);
  font-family: 'Manrope', system-ui, sans-serif;
  position: relative;
  overflow: hidden;
}

/* status bar */
.rd-statusbar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 24px;
  padding: 10px 24px;
  border-bottom: 1px solid var(--g200);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.05em;
  color: var(--g600);
  text-transform: uppercase;
}
.rd-statusbar__cell--center { text-align: center; }
.rd-statusbar__cell--right { text-align: right; }

/* dots */
.rd-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--g400);
  margin-right: 6px;
  vertical-align: 1px;
}
.rd-dot--live {
  background: var(--accent);
  box-shadow: 0 0 0 0 rgba(255, 92, 53, 0.5);
  animation: rd-pulse 2s infinite;
}
@keyframes rd-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(255, 92, 53, 0.5); }
  70%  { box-shadow: 0 0 0 6px rgba(255, 92, 53, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 92, 53, 0); }
}

/* monumental banner */
.rd-banner {
  position: relative;
  padding: 56px 48px 32px;
  border-bottom: 1px solid var(--g200);
  background:
    linear-gradient(transparent 95%, var(--g100) 95%) 0 0 / 100% 24px,
    linear-gradient(90deg, transparent 95%, var(--g100) 95%) 0 0 / 24px 100%,
    var(--paper);
}
.rd-reg {
  position: absolute;
  width: 24px;
  height: 24px;
  color: var(--g400);
}
.rd-reg--tl { top: 16px; left: 16px; }
.rd-reg--tr { top: 16px; right: 16px; }
.rd-reg--bl { bottom: 16px; left: 16px; }
.rd-reg--br { bottom: 16px; right: 16px; }

.rd-banner__meta {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--g500);
  letter-spacing: 0.06em;
  display: flex;
  justify-content: space-between;
  text-transform: uppercase;
  max-width: 1280px;
  margin: 0 auto;
}
.rd-banner__meta--top { margin-bottom: 24px; }
.rd-banner__meta--bottom { margin-top: 24px; }

.rd-banner__h {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.06em;
  font-family: 'Major Mono Display', ui-monospace, monospace;
  font-size: clamp(64px, 14vw, 220px);
  line-height: 0.9;
  letter-spacing: -0.02em;
  margin: 0;
  font-weight: 400;
  color: var(--ink);
  white-space: nowrap;
  animation: rd-rise 0.9s cubic-bezier(0.2, 0.7, 0.1, 1) both;
}
.rd-banner__word { display: inline-block; }
.rd-banner__arrow {
  display: inline-block;
  width: clamp(60px, 12vw, 180px);
  height: clamp(20px, 3vw, 40px);
  color: var(--accent);
  transform: translateY(-0.05em);
  margin: 0 0.04em;
}
@keyframes rd-rise {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* hero body */
.rd-hero {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 48px;
  padding: 56px 48px 80px;
  max-width: 1280px;
  margin: 0 auto;
  position: relative;
}
.rd-hero__left {
  display: flex;
  flex-direction: column;
  gap: 28px;
  animation: rd-rise 1s 0.1s cubic-bezier(0.2, 0.7, 0.1, 1) both;
}
.rd-hero__right {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-self: start;
  animation: rd-rise 1s 0.25s cubic-bezier(0.2, 0.7, 0.1, 1) both;
}

.rd-eyebrow {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--g500);
  text-transform: uppercase;
}
.rd-divider-v {
  display: inline-block;
  width: 1px;
  height: 12px;
  background: var(--g300);
}

.rd-wordmark {
  font-family: 'Major Mono Display', ui-monospace, monospace;
  font-size: clamp(56px, 8vw, 112px);
  line-height: 0.9;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.rd-headline {
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: clamp(28px, 3.5vw, 48px);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
  margin: 0;
  color: var(--ink);
}
.rd-headline em {
  font-family: 'Major Mono Display', ui-monospace, monospace;
  font-style: normal;
  font-weight: 400;
  font-size: 0.95em;
  letter-spacing: 0.01em;
  border-bottom: 3px solid var(--accent);
  padding-bottom: 0.05em;
}

.rd-sub {
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: var(--g600);
  max-width: 52ch;
  margin: 0;
}

.rd-specs {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--g200);
}
.rd-spec {
  display: grid;
  grid-template-columns: 48px 1fr 1.1fr;
  gap: 16px;
  align-items: baseline;
  padding: 18px 0;
  border-bottom: 1px solid var(--g200);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
.rd-spec__id        { font-size: 11px; color: var(--g400); letter-spacing: 0.1em; }
.rd-spec__primary   { font-size: 14px; font-weight: 700; color: var(--ink); letter-spacing: 0.06em; text-transform: uppercase; }
.rd-spec__secondary { font-size: 12px; color: var(--g500); letter-spacing: 0.06em; text-transform: uppercase; }

.rd-cta-row {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.rd-cta {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  padding: 20px 32px;
  background: rgba(10, 10, 10, 0.92);
  color: var(--paper);
  text-decoration: none;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  border: 1px solid rgba(10, 10, 10, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(20px);
  transition: transform 240ms cubic-bezier(0.2, 0.7, 0.1, 1), background-color 240ms;
}
.rd-cta::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    transparent 30%,
    rgba(255, 255, 255, 0.14) 50%,
    transparent 70%
  );
  transform: translateX(-100%);
  transition: transform 600ms cubic-bezier(0.2, 0.7, 0.1, 1);
}
.rd-cta:hover { background: rgba(10, 10, 10, 1); transform: translateY(-2px); }
.rd-cta:hover::before { transform: translateX(100%); }
.rd-cta__arrow { font-size: 16px; transition: transform 240ms; }
.rd-cta:hover .rd-cta__arrow { transform: translate(4px, -4px); }
.rd-cta-note {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--g500);
  letter-spacing: 0.1em;
}

/* clock */
.rd-clock {
  background: rgba(10, 10, 10, 0.94);
  color: var(--paper);
  padding: 28px 28px 24px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  position: relative;
  overflow: hidden;
}
.rd-clock::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 12px 12px;
  pointer-events: none;
}
.rd-clock__head {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.1em;
  margin-bottom: 16px;
  position: relative;
}
.rd-clock__digits {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-variant-numeric: tabular-nums;
  position: relative;
}
.rd-clock__big {
  font-family: 'Major Mono Display', ui-monospace, monospace;
  font-size: clamp(48px, 7vw, 80px);
  line-height: 0.9;
  letter-spacing: -0.02em;
  color: var(--paper);
}
.rd-clock__big--accent { color: var(--accent); }
.rd-clock__sep {
  font-family: 'Major Mono Display', ui-monospace, monospace;
  font-size: clamp(48px, 7vw, 80px);
  color: rgba(255, 255, 255, 0.3);
  line-height: 0.9;
}
.rd-clock__ms {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.4);
  margin-left: 8px;
}
.rd-clock__foot {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  position: relative;
}

/* dispatch feed */
.rd-feed {
  border: 1px solid var(--g200);
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
.rd-feed__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--g200);
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--g500);
  background: var(--g100);
}
.rd-feed__list { list-style: none; margin: 0; padding: 0; }
.rd-feed__row {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--g200);
  font-size: 11px;
  letter-spacing: 0.04em;
}
.rd-feed__row:last-child { border-bottom: none; }
.rd-feed__plus { color: var(--accent); font-weight: 700; }
.rd-feed__loc  { color: var(--ink); font-weight: 500; text-transform: uppercase; }
.rd-feed__ago  { color: var(--g400); font-size: 10px; }

/* ticker */
.rd-ticker {
  border-top: 1px solid var(--g200);
  border-bottom: 1px solid var(--g200);
  background: var(--ink);
  color: var(--paper);
  overflow: hidden;
  padding: 14px 0;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
  letter-spacing: 0.1em;
}
.rd-ticker__track {
  display: flex;
  animation: rd-marquee 40s linear infinite;
  width: max-content;
}
.rd-ticker__group { display: flex; flex-shrink: 0; }
.rd-ticker__item {
  padding: 0 24px;
  color: rgba(255, 255, 255, 0.85);
  text-transform: uppercase;
  white-space: nowrap;
}
.rd-ticker__sep {
  color: var(--accent);
  margin-right: 12px;
  display: inline-block;
}
@keyframes rd-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-33.333%); }
}

/* responsive */
@media (max-width: 880px) {
  .rd-hero { grid-template-columns: 1fr; }
}
@media (max-width: 720px) {
  .rd-statusbar { grid-template-columns: 1fr; gap: 6px; }
  .rd-statusbar__cell--center, .rd-statusbar__cell--right { text-align: left; }
  .rd-banner { padding: 40px 24px 24px; }
  .rd-banner__meta--top, .rd-banner__meta--bottom { display: none; }
  .rd-hero { padding: 40px 24px 60px; gap: 32px; }
  .rd-spec { grid-template-columns: 32px 1fr; }
  .rd-spec__secondary { grid-column: 2; font-size: 11px; }
}

@media (prefers-reduced-motion: reduce) {
  .rd-banner__h, .rd-hero__left, .rd-hero__right { animation: none; }
  .rd-ticker__track { animation: none; }
  .rd-dot--live { animation: none; }
}
`;
