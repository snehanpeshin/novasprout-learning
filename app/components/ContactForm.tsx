"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, Mail, Send } from "lucide-react";
import { bookingUrl, contactEmail } from "../site-data";

const subjects = ["Math", "Science & STEM", "Coding & Data Skills", "Study Skills", "Not sure yet"];

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "fallback" | "error">("idle");
  const [fallbackEmail, setFallbackEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [timezone, setTimezone] = useState("");

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
  }, []);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending" || status === "sent") return;

    const form = event.currentTarget;
    setErrorMessage("");
    if (!form.checkValidity()) {
      setStatus("error");
      setErrorMessage("Please complete the highlighted required field.");
      form.reportValidity();
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");

    const emailBody = [
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Grade or level: ${data.grade}`,
      `Subject: ${data.subject}`,
      `Goal or challenge: ${data.goal}`,
      `Preferred days/times: ${data.availability}`,
      `Time zone: ${data.timezone}`,
      `Message: ${data.message || "Not provided"}`
    ].join("\n");
    const preparedEmail = `mailto:${contactEmail}?subject=${encodeURIComponent("Free Demo Class request")}&body=${encodeURIComponent(emailBody)}`;
    setFallbackEmail(preparedEmail);

    try {
      const response = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await response.json().catch(() => ({})) as { delivery?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "Online delivery is temporarily unavailable.");
      if (result.delivery === "email") {
        setStatus("fallback");
        return;
      }
      setStatus("sent");
      form.reset();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Online delivery is temporarily unavailable.");
      setStatus("fallback");
    }
  }

  if (status === "sent") {
    return (
      <div className="ns-form-success" role="status">
        <CheckCircle2 aria-hidden="true" />
        <h3>Your request is in.</h3>
        <p>We’ll review the subject, level, goals, and schedule before suggesting the next step.</p>
        <div className="ns-form-success-actions">
          <a className="ns-button ns-button-primary" href={bookingUrl} target="_blank" rel="noreferrer">Choose a demo time</a>
          <a className="ns-text-link" href={`mailto:${contactEmail}`}>Add something by email</a>
        </div>
      </div>
    );
  }

  return (
    <form className="ns-intake-form" noValidate onSubmit={submitRequest}>
      <div className="ns-form-intro">
        <p className="ns-card-kicker">What happens next</p>
        <h3>Reviewed by the NovaSprout team.</h3>
        <p>We’ll email a tutor recommendation or a follow-up question. If a suitable match is available, you can then choose a free demo time.</p>
      </div>
      <div className="ns-form-grid">
        <label>
          Parent/guardian or adult student name
          <input name="name" autoComplete="name" maxLength={80} required />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" maxLength={120} required />
        </label>
        <label>
          Student grade or learning level
          <input name="grade" placeholder="For example, Grade 7" maxLength={60} required />
        </label>
        <label>
          Subject
          <select name="subject" defaultValue="" required>
            <option value="" disabled>Select a subject</option>
            {subjects.map((subject) => <option key={subject}>{subject}</option>)}
          </select>
        </label>
        <label className="ns-form-wide">
          Primary goal or challenge
          <input name="goal" placeholder="What would make tutoring useful right now?" maxLength={240} required />
        </label>
        <label>
          Preferred days and times
          <input name="availability" placeholder="Weekday evenings" maxLength={120} required />
        </label>
        <label>
          Time zone
          <input
            name="timezone"
            placeholder="For example, Eastern Time"
            maxLength={80}
            required
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
          />
        </label>
        <label className="ns-form-wide">
          Anything else? <span>(optional)</span>
          <textarea name="message" rows={3} maxLength={800} />
        </label>
        <label className="ns-honeypot" aria-hidden="true">
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p className="ns-form-note">For students under 18, a parent or guardian should submit the request. Please do not include sensitive educational, health, or payment information.</p>
      <button className="ns-button ns-button-primary" disabled={status === "sending"} type="submit">
        {status === "sending" ? <LoaderCircle className="ns-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
        {status === "sending" ? "Sending request…" : "Request a Free Demo Class"}
      </button>
      {status === "error" ? (
        <div className="ns-form-error" role="alert">
          <p>{errorMessage}</p>
        </div>
      ) : null}
      {status === "fallback" ? (
        <div className="ns-form-fallback" role="status">
          <div>
            <strong>Finish your request by email.</strong>
            <p>{errorMessage || `Your details are ready to send to ${contactEmail}.`}</p>
          </div>
          <a className="ns-button ns-button-secondary" href={fallbackEmail}>
            <Mail aria-hidden="true" />
            Open prepared email
          </a>
        </div>
      ) : null}
    </form>
  );
}
