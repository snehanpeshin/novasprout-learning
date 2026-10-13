"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, CreditCard, Sparkles, UsersRound } from "lucide-react";
import { bookingUrl } from "../site-data";
const tutorSubjects = ["Math", "Science & STEM", "Coding & Data Skills", "Study Skills"] as const;
const tutorPlans = ["demo", "single", "monthly"] as const;
type TutorPlan = typeof tutorPlans[number];
type TutorTiming = "within_24_hours" | "this_week" | "planning_ahead";
type TutorMatchStatus = "requested" | "reviewing" | "matched" | "demo_scheduled" | "paid" | "active" | "closed";
type TutorMatchSummary = { id: string; status: TutorMatchStatus; subject: string; studentLevel: string; requestedPlan: TutorPlan; timing: TutorTiming; tutorLabel: string | null; nextStep: string | null; updatedAt: string; };

const planCopy: Record<TutorPlan, { label: string; detail: string; productKey?: "tutoring_session" | "monthly_subscription" }> = {
  demo: { label: "Free tutor match and demo", detail: "Meet a recommended tutor before making any purchase." },
  single: { label: "$20 single class", detail: "Choose one online class after your match is ready.", productKey: "tutoring_session" },
  monthly: { label: "Monthly tutoring package", detail: "Continue with a recurring plan after your match is ready.", productKey: "monthly_subscription" }
};

const statusCopy: Record<TutorMatchSummary["status"], string> = {
  requested: "Your matching details are saved. The NovaSprout team is reviewing the request.",
  reviewing: "We are checking subject fit and availability for your request.",
  matched: "A tutor recommendation is ready for your family.",
  demo_scheduled: "Your demo is scheduled. Check your email for the meeting details.",
  paid: "Your payment is confirmed. We are finalizing the learning plan and schedule.",
  active: "Your tutoring plan is active.",
  closed: "This request has been closed. You can start a new match whenever you need one."
};

const timingCopy: Record<TutorTiming, { label: string; detail: string }> = {
  within_24_hours: { label: "I need help within 24 hours", detail: "We will use your available times to prioritize the match. Start an AI lesson while you wait." },
  this_week: { label: "I need help this week", detail: "A good fit for an upcoming test, project, or catch-up plan." },
  planning_ahead: { label: "I am planning ahead", detail: "Choose a tutor plan and a schedule that can continue over time." }
};

export default function FamilyPortal() {
  const [match, setMatch] = useState<TutorMatchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/tutor-match", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : { match: null })
      .then((data: { match?: TutorMatchSummary | null }) => setMatch(data.match ?? null))
      .catch(() => setError("We could not load the portal just now."))
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) return form.reportValidity();
    setSending(true);
    setError("");
    const fields = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/tutor-match", { body: JSON.stringify(fields), headers: { "Content-Type": "application/json" }, method: "POST" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "We could not save your matching request.");
      const refreshed = await fetch("/api/tutor-match", { cache: "no-store" });
      const data = await refreshed.json() as { match?: TutorMatchSummary | null };
      setMatch(data.match ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "We could not save your matching request.");
    } finally {
      setSending(false);
    }
  }

  async function checkout(plan: TutorPlan) {
    const productKey = planCopy[plan].productKey;
    if (!productKey) return;
    setPaying(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/checkout", { body: JSON.stringify({ productKey }), headers: { "Content-Type": "application/json" }, method: "POST" });
      const result = await response.json() as { error?: string; url?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Checkout is temporarily unavailable.");
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout is temporarily unavailable.");
      setPaying(false);
    }
  }

  if (loading) return <div className="ns-portal-loading">Opening your family portal…</div>;

  if (match) {
    const plan = planCopy[match.requestedPlan];
    return <section className="ns-portal-card" aria-live="polite">
      <div className="ns-portal-status"><CheckCircle2 /><span>Family portal</span></div>
      <h2>{match.tutorLabel ? `Your recommended tutor: ${match.tutorLabel}` : "Your tutor match is in progress."}</h2>
      <p>{statusCopy[match.status]}</p>
      <dl className="ns-portal-summary">
        <div><dt>Subject</dt><dd>{match.subject}</dd></div>
        <div><dt>Level</dt><dd>{match.studentLevel}</dd></div>
        <div><dt>Selected path</dt><dd>{plan.label}</dd></div>
      </dl>
      <p className="ns-portal-next"><strong>Timing:</strong> {timingCopy[match.timing].label}</p>
      {match.nextStep ? <p className="ns-portal-next"><strong>Next step:</strong> {match.nextStep}</p> : null}
      {(match.status === "requested" || match.status === "reviewing") ? <div className="ns-portal-actions"><a className="ns-button ns-button-primary" href={bookingUrl} rel="noreferrer" target="_blank"><Clock3 />Choose a matching-call time</a><a className="ns-button ns-button-secondary" href="/ai-lesson-generator"><Sparkles />Start an AI lesson now</a></div> : null}
      {match.status === "matched" && plan.productKey ? <button className="ns-button ns-button-primary" disabled={paying} onClick={() => checkout(match.requestedPlan)} type="button"><CreditCard />{paying ? "Opening checkout…" : `Pay for ${plan.label}`}</button> : null}
      {error ? <p className="ns-form-error" role="alert">{error}</p> : null}
    </section>;
  }

  return <form className="ns-portal-form" onSubmit={submit}>
    <div className="ns-portal-form-intro"><p className="ns-eyebrow">Start your online learning plan</p><h2>Choose the support that fits today.</h2><p>Tell us when help is needed, the subject, and the student's available times. We use that to match a tutor; if the need is immediate, NovaSprout Clear can help the student begin now.</p></div>
    <fieldset><legend>1. Choose a subject</legend><div className="ns-choice-grid">{tutorSubjects.map(subject => <label className="ns-choice" key={subject}><input defaultChecked={subject === "Math"} name="subject" type="radio" value={subject} /><span>{subject}</span></label>)}</div></fieldset>
    <fieldset><legend>2. Choose how you want to begin</legend><div className="ns-choice-grid ns-plan-grid">{tutorPlans.map(plan => <label className="ns-choice" key={plan}><input defaultChecked={plan === "demo"} name="plan" type="radio" value={plan} /><span><strong>{planCopy[plan].label}</strong><small>{planCopy[plan].detail}</small></span></label>)}</div></fieldset>
    <fieldset><legend>3. When does the student need help?</legend><div className="ns-choice-grid ns-timing-grid">{(Object.keys(timingCopy) as TutorTiming[]).map(timing => <label className="ns-choice" key={timing}><input defaultChecked={timing === "this_week"} name="timing" type="radio" value={timing} /><span><strong>{timingCopy[timing].label}</strong><small>{timingCopy[timing].detail}</small></span></label>)}</div></fieldset>
    <fieldset className="ns-portal-details"><legend>4. Help us make the match</legend><label>Parent/guardian or adult student name<input autoComplete="name" maxLength={80} name="name" required /></label><label>Email<input autoComplete="email" maxLength={120} name="email" required type="email" /></label><label>Student level<input maxLength={60} name="studentLevel" placeholder="For example, Grade 7" required /></label><label>Time zone<input defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone || ""} maxLength={80} name="timezone" placeholder="For example, Eastern Time" required /></label><label>Learning goal or upcoming deadline<textarea maxLength={500} name="goal" placeholder="For example, algebra test on Friday or a confusing homework topic" required rows={3} /></label><label>Preferred days and times<input maxLength={120} name="availability" placeholder="For example, today after 5pm or Tuesday after 5pm" required /></label><input className="ns-honeypot" name="website" tabIndex={-1} autoComplete="off" /></fieldset>
    <p className="ns-form-note">For students under 18, a parent or guardian must submit the request. Please do not include payment, health, or highly sensitive educational information.</p>
    <button className="ns-button ns-button-primary" disabled={sending} type="submit"><UsersRound />{sending ? "Saving your plan…" : "Find my tutor match"}<ArrowRight /></button>
    <p className="ns-portal-ai-note"><Sparkles aria-hidden="true" />Need help before a tutor is confirmed? <a href="/ai-lesson-generator">Create a personalized AI lesson now</a>.</p>
    {error ? <p className="ns-form-error" role="alert">{error}</p> : null}
  </form>;
}
