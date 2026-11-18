"use client";
import { useEffect, useState } from "react";
import type { TutorUsageReport, TutorEvent } from "../../lib/tutorAnalytics";
type Report = { usage: TutorUsageReport; configuration: { generationConfigured: boolean; model: string; privateDemoConfigured: boolean } };
const labels: Array<[TutorEvent, string]> = [
  ["lessons", "Completed lessons"], ["replies", "Guided tutor replies"], ["videos", "Video plans"],
  ["illustrations", "Scene illustrations"], ["narrations", "Scene narrations"]
];
export default function AdminTutorOverview({ token, refresh }: { token: string; refresh: number }) {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setReport(null); setError(""); setLoading(true);
    (async () => {
      try {
        const response = await fetch("/api/admin/tutor-usage", {
          headers: { "x-admin-token": token }, cache: "no-store", signal: controller.signal
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Tutor activity could not be loaded.");
        if (!controller.signal.aborted) setReport(data);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Tutor activity could not be loaded.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [token, refresh]);
  return <section className="admin-content admin-tutor-overview" aria-label="AI tutor overview">
    <article className="admin-table" aria-live="polite">
      <p className="eyebrow">AI tutor activity</p><h2>How the tutor is being used</h2>
      <p>Last 14 days, including today. Daily boundaries use UTC. Counts record successful server outputs, not unique students or learning gains.</p>
      {loading ? <p role="status">Loading tutor activity...</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {report ? <>
        <p className="admin-tracking-note">{report.usage.trackingSince
          ? "Tracking since " + new Date(report.usage.trackingSince).toLocaleString("en-US", { timeZone: "UTC" }) + " UTC."
          : "Tracking is ready. No tutor activity has been recorded yet."} Earlier activity is not backfilled. Sample playback and cached outputs do not add counts.</p>
        <div className="metric-grid tutor-metric-grid">{labels.map(([key, label]) =>
          <article key={key}><span>{label}</span><strong>{report.usage.totals[key].toLocaleString()}</strong></article>)}</div>
        <details className="admin-daily-report"><summary>View daily activity</summary>
          <div className="admin-table-scroll"><table><caption>Successful AI tutor outputs per day (UTC)</caption>
            <thead><tr><th scope="col">Date</th>{labels.map(([key, label]) => <th scope="col" key={key}>{label}</th>)}</tr></thead>
            <tbody>{[...report.usage.days].reverse().map(day => <tr key={day.date}><th scope="row">{day.date}</th>
              {labels.map(([key]) => <td key={key}>{day[key]}</td>)}</tr>)}</tbody>
          </table></div>
        </details>
        <p className="report-row"><span>AI generation configuration</span><strong>{report.configuration.generationConfigured ? "Configured" : "Setup required"}</strong></p>
        <p className="report-row"><span>Lesson model</span><strong>{report.configuration.model}</strong></p>
        <p className="admin-empty">Configuration and ledger access are checked here. Use the live tutor to verify an actual generated lesson.</p>
      </> : null}
    </article>
    {report ? <article className="admin-table admin-tutor-presentation">
      <p className="eyebrow">Present NovaSprout</p><h2>Show the AI tutor in action</h2>
      <p>Start with the sample, then demonstrate a lesson on your audience's topic.</p>
      <div className="admin-demo-actions">
        <a className="button primary" href="/present" target="_blank" rel="noopener noreferrer">Launch presentation mode</a>
        <a className="button secondary" href="/ai-lesson-generator?sample=1#generator" target="_blank" rel="noopener noreferrer">Open free sample</a>
        <a className="button secondary" href="/ai-lesson-generator#generator" target="_blank" rel="noopener noreferrer">Open live AI tutor</a>
      </div>
      <ol className="admin-demo-steps">
        <li><strong>Choose a topic.</strong> Set the learner level and learning goal.</li>
        <li><strong>Explain visually.</strong> Show the lesson, then prepare its illustrated, narrated video.</li>
        <li><strong>Invite an attempt.</strong> Use practice and ask the tutor for a hint or feedback.</li>
        <li><strong>Check understanding.</strong> Correct mistakes and try a fresh question; revisit later.</li>
      </ol>
      <p className="admin-empty">The sample needs no payment. New lessons require an eligible purchase or private tutor access code. The admin token does not unlock learner access. This report measures use, not proven mastery or a two-sigma gain.</p>
    </article> : null}
  </section>;
}
