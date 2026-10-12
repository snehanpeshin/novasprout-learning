"use client";
import { useState } from "react";
export default function AiCoach({ accessToken, lessonTicket }: { accessToken: string; lessonTicket: string }) {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<{role:string;content:string}[]>([]);
  const [feedback, setFeedback] = useState<{reply:string;hint:string;checkQuestion:string} | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function ask(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError("");
    const asked = question.trim();
    try {
      const response = await fetch("/api/ai-coach", { method: "POST", headers: { "Content-Type": "application/json", "x-ai-access-token": accessToken, "x-ai-lesson-ticket": lessonTicket }, body: JSON.stringify({ question: asked, history }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not answer just now.");
      setFeedback(data); setQuestion(""); setHistory(current => [...current, {role:"user",content:asked}, {role:"assistant",content:[data.reply,data.hint,data.checkQuestion].join("\n")}].slice(-6));
    } catch (error) { setError(error instanceof Error ? error.message : "The tutor is unavailable."); }
    finally { setBusy(false); }
  }
  return <section className="ai-coach"><h3>Ask your lesson tutor</h3><p>Tell me which step is confusing, or show your attempt. I’ll offer a hint and a quick question to check your understanding. Up to 10 questions are included.</p>
    {feedback && <div className="ai-coach-feedback" aria-live="polite"><p>{feedback.reply}</p><h4>A small hint</h4><p>{feedback.hint}</p><h4>Check your understanding</h4><p>{feedback.checkQuestion}</p></div>}
    <form onSubmit={ask}><label>Your question or attempt<textarea required minLength={2} maxLength={1200} value={question} onChange={event=>setQuestion(event.target.value)} placeholder="I tried this step, but I’m not sure why..." /></label><button className="button primary" disabled={busy || question.trim().length<2} type="submit">{busy ? "Thinking..." : "Get a hint"}</button></form>{error && <p role="status">{error}</p>}
  </section>;
}
