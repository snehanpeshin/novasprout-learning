"use client";
import { useEffect, useRef, useState } from "react";
type Access = { active: boolean; plan?: string; remaining?: number; renewalDate?: string; recoveryCode?: string };
export default function AiPaidPlans({ onAccessChange }: { onAccessChange: (active: boolean, remaining?: number) => void }) {
  const callback = useRef(onAccessChange); callback.current = onAccessChange;
  const [access, setAccess] = useState<Access>({ active: false });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [parentConfirmed, setParentConfirmed] = useState(false);
  const [recovery, setRecovery] = useState("");
  async function refresh() {
    const response = await fetch("/api/ai-access", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not verify access.");
    setAccess(data); callback.current(Boolean(data.active), data.remaining);
  }
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const url = new URL(window.location.href);
        const sessionId = url.searchParams.get("checkout_session_id");
        if (sessionId) {
          setBusy(true);
          const response = await fetch("/api/ai-access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }) });
          const data = await response.json();
          url.searchParams.delete("checkout_session_id");
          window.history.replaceState({}, "", url.toString());
          if (!response.ok) throw new Error(data.error || "Payment could not be verified.");
          if (alive) setMessage("Payment verified. Your AI Tutor is ready.");
        }
        if (alive) await refresh();
      } catch (error) { if (alive) setMessage(error instanceof Error ? error.message : "Could not activate access."); }
      finally { if (alive) setBusy(false); }
    })();
    const listener = () => { refresh().catch(() => setMessage("Could not refresh the allowance. Please try again.")); };
    window.addEventListener("novasprout-access-refresh", listener);
    return () => { alive = false; window.removeEventListener("novasprout-access-refresh", listener); };
  }, []);
  async function purchase(productKey: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productKey }) });
      const data = await response.json(); if (!response.ok || !data.url) throw new Error("Checkout is temporarily unavailable.");
      window.location.assign(data.url);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not open checkout."); setBusy(false); }
  }
  async function restore() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/ai-access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recoveryCode: recovery.trim() }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not restore access.");
      setRecovery(""); await refresh(); setMessage("Your purchase is restored.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not restore access."); }
    finally { setBusy(false); }
  }
  function saveAccess() {
    if (!access.recoveryCode) return;
    const url = URL.createObjectURL(new Blob([access.recoveryCode], { type: "text/plain" }));
    const link = document.createElement("a"); link.href = url; link.download = "novasprout-private-access-code.txt"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Keep this private code safe. Use Restore purchase to open your paid access on another browser.");
  }
  async function billing() {
    setBusy(true);
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" }); const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not open billing."); window.location.assign(data.url);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not open billing."); setBusy(false); }
  }
  return <section className="ai-paid-plans" aria-label="AI Tutor paid plans">
    <h3>AI Tutor plans</h3>
    <p>One AI lesson is $2.99. Monthly AI Tutor is $14.99/month for up to 20 lessons per billing month. Each lesson includes guided practice, a quiz, a visual PDF, and up to 10 tutor questions within 24 hours of generation.</p>
    <p>Monthly access renews automatically until cancelled. Cancel in Manage billing; access continues through the paid period. Unused monthly lessons do not roll over. AI can make mistakes; review important answers with a parent or tutor.</p>
    {access.active && <div className="ai-access-status" role="status"><strong>{access.plan === "monthly" ? "Monthly AI Tutor" : "One AI lesson"}: {access.remaining} lessons available</strong>{access.renewalDate && <p>Current period ends {new Date(access.renewalDate).toLocaleDateString()}.</p>}<button className="button secondary" disabled={busy} onClick={refresh} type="button">Refresh allowance</button><button className="button secondary" onClick={saveAccess} type="button">Save private access code</button><button className="button secondary" disabled={busy} onClick={billing} type="button">Manage billing</button></div>}
    <label className="ai-parent-confirm"><input type="checkbox" checked={parentConfirmed} onChange={event => setParentConfirmed(event.target.checked)} /> I am 18 or older, or a parent/guardian purchasing for a learner.</label>
    <div className="ai-plan-grid">
      <article className="ai-plan-card"><span className="eyebrow">One focused session</span><h4>One AI lesson</h4><p className="ai-plan-price">$2.99 <small>one time</small></p><p>A personalized visual lesson, guided practice, and a scored quiz.</p><button className="button primary full" disabled={busy || !parentConfirmed || (access.plan === "monthly")} onClick={() => purchase("ai_lesson")} type="button">Buy one lesson — $2.99</button></article>
      <article className="ai-plan-card ai-plan-monthly"><span className="eyebrow">Keep learning</span><h4>Monthly AI Tutor</h4><p className="ai-plan-price">$14.99 <small>/ month</small></p><p>Up to 20 lessons per billing month, with guided tutor questions.</p><button className="button primary full" disabled={busy || !parentConfirmed || access.plan === "monthly"} onClick={() => purchase("ai_subscription")} type="button">Subscribe — $14.99/month</button></article>
    </div>
    <details><summary>Restore a website purchase</summary><label>Private purchase access code<textarea value={recovery} onChange={event => setRecovery(event.target.value)} maxLength={2000} /></label><button className="button secondary" disabled={busy || !recovery.trim()} onClick={restore} type="button">Restore purchase</button><p>This restores website purchases. App Store purchases remain in the iOS app. If you lost the code, contact NovaSprout with your Stripe receipt.</p></details>
    {message && <p role="status">{message}</p>}
  </section>;
}
