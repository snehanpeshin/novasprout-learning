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
          <a href="/#subjects" onClick={() => setOpen(false)}>Subjects</a>
          <a href="/#how-it-works" onClick={() => setOpen(false)}>How It Works</a>
          <a href="/pricing" onClick={() => setOpen(false)}>Pricing</a>
          <a href="/#why" onClick={() => setOpen(false)}>Why NovaSprout</a>
          <a className="ns-nav-secondary" href="/become-a-tutor" onClick={() => setOpen(false)}>Become a Tutor</a>
          <a className="ns-button ns-button-primary ns-nav-cta" href="/contact#free-demo" onClick={() => setOpen(false)}>
            Book a Free Demo
          </a>
        </nav>
      </div>
    </header>
  );
}
