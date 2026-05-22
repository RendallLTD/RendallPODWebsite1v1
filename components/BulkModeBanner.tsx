"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "rendall_bulk_mode";

export default function BulkModeBanner() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlFlag = params.get("bulk") === "1";

    if (urlFlag) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      params.delete("bulk");
      const qs = params.toString();
      const newUrl = window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash;
      window.history.replaceState({}, "", newUrl);
    }

    setActive(sessionStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function exitBulk() {
    sessionStorage.removeItem(STORAGE_KEY);
    setActive(false);
  }

  if (!active) return null;

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#859aa6",
        color: "#fff",
        padding: "10px 16px",
        fontSize: 14,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <span>🛒 Bulk order mode — design once, ship to many.</span>
      <button
        type="button"
        onClick={exitBulk}
        style={{
          background: "rgba(255,255,255,0.2)",
          border: "1px solid rgba(255,255,255,0.4)",
          color: "#fff",
          padding: "4px 12px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Exit bulk mode
      </button>
    </div>
  );
}
