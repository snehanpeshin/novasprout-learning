"use client";
import { useEffect, useRef, useState } from "react";
export default function AiCoach({ accessToken, lessonTicket, suggestedQuestion, suggestedQuestionVersion=0 }: { accessToken: string; lessonTicket: string; suggestedQuestion?: string; suggestedQuestionVersion?: number }) {
  const [question, setQuestion] = useState("");
  const input=useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (suggestedQuestion) {setQuestion(suggestedQuestion);input.current?.focus();} }, [suggestedQuestion,suggestedQuestionVersion]);
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
  return <section className="ai-coach" id="lesson-ai-coach"><h3>Let's figure it out</h3><p>Tell me what feels tricky or show me what you tried. We will work through it one step at a time. You can ask up to 10 questions.</p>
    {feedback && <div className="ai-coach-feedback" aria-live="polite"><p>{feedback.reply}</p><h4>A small hint</h4><p>{feedback.hint}</p><h4>Check your understanding</h4><p>{feedback.checkQuestion}</p></div>}
    <form onSubmit={ask}><label>Your question or attempt<textarea ref={input} required minLength={2} maxLength={1200} value={question} onChange={event=>setQuestion(event.target.value)} placeholder="I tried this step, but I’m not sure why..." /></label><button className="button primary" disabled={busy || question.trim().length<2} type="submit">{busy ? "Thinking..." : "Get a hint"}</button></form>{error && <p role="status">{error}</p>}
  </section>;
}
