"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="ns-header">
      <div className="ns-header-inner">
        <a className="ns-brand" href="/" aria-label="NovaSprout Learning home">
          <img src="/novasprout-logo.png" alt="" width="48" height="48" />
          <span>NovaSprout <em>Learning</em></span>
        </a>

        <a className="ns-header-ai-cta ns-button ns-button-primary" href="/ai-lesson-generator">AI Tutor <span aria-hidden="true">↗</span></a>
        <button
          className="ns-menu-button"
          type="button"
          aria-expanded={open}
          aria-controls="site-navigation"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <nav className={open ? "ns-nav is-open" : "ns-nav"} id="site-navigation" aria-label="Main navigation">
          <a href="/ai-lesson-generator" onClick={() => setOpen(false)}>AI Tutor</a>
          <a href="/#how-it-works" onClick={() => setOpen(false)}>How It Works</a>
          <a href="/pricing" onClick={() => setOpen(false)}>AI Pricing</a>
          <a className="ns-nav-secondary" href="/human-tutoring" onClick={() => setOpen(false)}>Human Support</a>
          <a className="ns-button ns-button-primary ns-nav-cta" href="/ai-lesson-generator" onClick={() => setOpen(false)}>Start with AI Tutor</a>
        </nav>
      </div>
    </header>
  );
}
