"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    // Simple HEAD-style probe: ask the admin gate by fetching /admin and
    // checking whether we get redirected. Keeps the admin UUID list off the
    // client bundle (env-backed; server-only).
    fetch("/api/admin/whoami", { method: "GET" })
      .then((r) => r.ok)
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false));
  }, [user]);

  return (
    <header className="header">
      <div className="container header__inner">
        <Link href="/" className="logo"><img src="/logo.svg" alt="" className="logo__icon" /><span className="logo__text">rend<span>all</span></span></Link>
        <nav className="nav">
          <Link href="/catalog">Catalog</Link>
          <a href="/#how-it-works">How It Works</a>
          <a href="/#pricing">Pricing</a>
          <a href="/#calculator">Earnings</a>
          <a href="/policies">Policies</a>
        </nav>
        <div className="header__actions">
          {user ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="btn btn--outline btn--sm">Admin</Link>
              )}
              <Link href="/dashboard" className="btn btn--outline btn--sm">Dashboard</Link>
              <Link href="/cart" className="header__cart" aria-label="Cart">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn--outline btn--sm">Log in</Link>
              <Link href="/signup" className="btn btn--primary btn--sm">Get started for free</Link>
            </>
          )}
        </div>
        <button
          className="mobile-toggle"
          onClick={() => document.querySelector(".nav")?.classList.toggle("nav--open")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
      </div>
    </header>
  );
}
