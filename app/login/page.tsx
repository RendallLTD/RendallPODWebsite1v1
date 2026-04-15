"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction } from "./actions";

const DEFAULT_REDIRECT = "/dashboard";

function safeRedirect(target: string | null): string {
  if (!target) return DEFAULT_REDIRECT;
  // Must be a relative path starting with a single "/"
  // Reject "//", "/\", and anything containing a scheme or backslash
  if (
    target.length < 2 ||
    target[0] !== "/" ||
    target[1] === "/" ||
    target[1] === "\\" ||
    target.includes("\\")
  ) {
    return DEFAULT_REDIRECT;
  }
  return target;
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get("redirect"));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await loginAction(new FormData(e.currentTarget));

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(redirect);
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Log in to your Rendall account</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required />
          </div>
          <button type="submit" className="btn btn--primary auth-submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account? <Link href="/signup">Sign up for free</Link>
        </p>
      </div>
    </section>
  );
}
