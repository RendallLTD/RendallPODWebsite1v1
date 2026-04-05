"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("free");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (profile) {
        setDisplayName(profile.display_name || "");
        setBusinessName(profile.business_name || "");
        setPlan(profile.plan || "free");
      }
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ display_name: displayName, business_name: businessName }).eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div>
      <h1 className="dashboard__title">Account Settings</h1>

      <form onSubmit={handleSave} className="settings-form">
        <div className="auth-field">
          <label>Email</label>
          <input type="email" value={email} disabled />
        </div>
        <div className="auth-field">
          <label>Display Name</label>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div className="auth-field">
          <label>Business Name</label>
          <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </div>
        <div className="auth-field">
          <label>Plan</label>
          <div className="settings-plan">
            <span className="tag" style={{ textTransform: "capitalize" }}>{plan}</span>
            {plan === "free" && <span style={{ fontSize: 13, color: "var(--accent-active)" }}>Upgrade to Premium for up to 20% off products</span>}
          </div>
        </div>

        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saved ? "Saved!" : saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
        <button className="btn btn--outline" onClick={handleSignOut}>Sign out</button>
      </div>
    </div>
  );
}
