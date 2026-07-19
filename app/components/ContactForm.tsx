"use client";

import { FormEvent, useState } from "react";
import { Mail, Phone, Send } from "lucide-react";
import { contactEmail, contactPhone, contactPhoneHref } from "../site-data";

export default function ContactForm() {
  const [notice, setNotice] = useState("");

  function prepareEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const service = String(data.get("service") ?? "General question").trim();
    const message = String(data.get("message") ?? "").trim();
    const subject = `NovaSprout inquiry: ${service}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      `Interested in: ${service}`,
      "",
      message
    ].join("\n");

    setNotice("Your email app is opening with the message prepared. Review it, then press Send.");
    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="contact-form-wrap">
      <form className="contact-form" onSubmit={prepareEmail}>
        <div className="contact-form-grid">
          <label>
            Name
            <input autoComplete="name" maxLength={80} name="name" required type="text" />
          </label>
          <label>
            Email
            <input autoComplete="email" maxLength={120} name="email" required type="email" />
          </label>
          <label>
            <span className="field-label">Phone <small>Optional</small></span>
            <input autoComplete="tel" maxLength={30} name="phone" type="tel" />
          </label>
          <label>
            Interested in
            <select defaultValue="Live Tutoring" name="service">
              <option>Live Tutoring</option>
              <option>AI Tutor</option>
              <option>Free Live Demo</option>
              <option>Monthly Tutoring</option>
              <option>Becoming a Tutor</option>
              <option>General Question</option>
            </select>
          </label>
        </div>
        <label>
          Message
          <textarea
            maxLength={1200}
            name="message"
            placeholder="Tell us the subject, grade level, goal, and preferred schedule."
            required
            rows={5}
          />
        </label>
        <p className="contact-privacy-note">Do not include sensitive student or payment information.</p>
        <button className="button primary" type="submit">
          <Send aria-hidden="true" size={18} />
          Prepare Email
        </button>
        {notice ? <p className="contact-form-notice" role="status">{notice}</p> : null}
      </form>
      <div className="contact-direct" aria-label="Direct contact details">
        <a href={`mailto:${contactEmail}`}>
          <Mail aria-hidden="true" size={19} />
          <span><strong>Email</strong>{contactEmail}</span>
        </a>
        <a href={contactPhoneHref}>
          <Phone aria-hidden="true" size={19} />
          <span><strong>Phone</strong>{contactPhone}</span>
        </a>
      </div>
    </div>
  );
}
