"use client";

import { useEffect, useRef, useState } from "react";

// Wraps the street-address input with Google Places Autocomplete (New API).
// On select, calls onPlaceSelect with parsed address fields. If the API key is
// missing or a request fails, the component silently no-ops — manual entry
// still works.

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const DETAILS_URL = "https://places.googleapis.com/v1/places";

export type ParsedPlace = {
  line1: string;
  city: string;
  state: string;
  country: string;
  postal: string;
};

type Suggestion = {
  placeId: string;
  text: string;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  onPlaceSelect: (p: ParsedPlace) => void;
  required?: boolean;
};

function newSessionToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type AddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

function parseComponents(components: AddressComponent[]): ParsedPlace {
  const get = (type: string, short = false): string => {
    const c = components.find((x) => x.types?.includes(type));
    if (!c) return "";
    return (short ? c.shortText : c.longText) ?? "";
  };
  const streetNumber = get("street_number");
  const route = get("route");
  const line1 = [streetNumber, route].filter(Boolean).join(" ").trim();
  const city = get("locality") || get("postal_town") || get("sublocality_level_1");
  const state = get("administrative_area_level_1", true);
  const country = get("country", true);
  const postal = get("postal_code");
  return { line1, city, state, country, postal };
}

export default function AddressAutocomplete({ value, onChange, onPlaceSelect, required }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const sessionTokenRef = useRef<string>(newSessionToken());
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function fetchSuggestions(q: string) {
    if (!API_KEY || q.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    fetch(AUTOCOMPLETE_URL, {
      method: "POST",
      signal: ac.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text",
      },
      body: JSON.stringify({
        input: q,
        sessionToken: sessionTokenRef.current,
        includedRegionCodes: ["us"],
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json?.suggestions) {
          setSuggestions([]);
          return;
        }
        type RawSuggestion = { placePrediction?: { placeId?: string; text?: { text?: string } } };
        const raw = json.suggestions as RawSuggestion[];
        const out: Suggestion[] = raw
          .map((s) => ({
            placeId: s.placePrediction?.placeId ?? "",
            text: s.placePrediction?.text?.text ?? "",
          }))
          .filter((s) => s.placeId && s.text);
        setSuggestions(out);
        setOpen(out.length > 0);
      })
      .catch(() => {
        // Silent fail — manual entry still works.
      });
  }

  function onInputChange(v: string) {
    onChange(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 250);
  }

  async function selectPlace(s: Suggestion) {
    setOpen(false);
    setSuggestions([]);
    if (!API_KEY) return;
    try {
      const url = `${DETAILS_URL}/${encodeURIComponent(s.placeId)}?sessionToken=${encodeURIComponent(sessionTokenRef.current)}`;
      const res = await fetch(url, {
        headers: {
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": "addressComponents",
        },
      });
      if (!res.ok) return;
      const json = (await res.json()) as { addressComponents?: AddressComponent[] };
      const parsed = parseComponents(json.addressComponents ?? []);
      onPlaceSelect(parsed);
    } catch {
      // Silent fail — user can still finish manually.
    } finally {
      // Session ends after a Place Details call. Start a fresh one for next typing.
      sessionTokenRef.current = newSessionToken();
    }
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <input
        required={required}
        value={value}
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 20,
            background: "#fff",
            border: "1px solid #d4d4d4",
            borderRadius: 6,
            margin: "4px 0 0",
            padding: 0,
            listStyle: "none",
            maxHeight: 240,
            overflowY: "auto",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectPlace(s)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#111",
                }}
              >
                {s.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
