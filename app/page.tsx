"use client";

import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  Sparkles
} from "lucide-react";
import Footer from "./components/Footer";
import TrackedLink from "./components/TrackedLink";
import { bookingUrl, learningSituations, processSteps, subjectTracks, tutoringFaqs } from "./site-data";

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="NovaSprout Learning home">
          <img className="brand-logo" src="/novasprout-logo.png" alt="" />
          <span>NovaSprout Learning</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#subjects">Subjects</a>
          <a href="/find-a-tutor">Find Tutor</a>
          <a href="/become-a-tutor">Tutor Signup</a>
          <a href="#how-it-works">How it works</a>
          <a href="/pricing">Pricing</a>
          <TrackedLink className="nav-cta" eventName="book_meeting_click" href={bookingUrl} target="_blank">
            Book free demo
          </TrackedLink>
        </nav>
      </header>

      <section className="demo-strip" aria-label="Free demo class announcement">
        <div className="demo-track">
          <span>First demo class free</span>
          <span>First paid session fit guarantee</span>
          <span>Live online tutoring</span>
          <span>First demo class free</span>
          <span>First paid session fit guarantee</span>
          <span>Live online tutoring</span>
        </div>
      </section>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Friendly online tutoring for curious students</p>
          <h1>Learn Math, Science, Coding, and Study Skills with live online support.</h1>
          <p className="hero-text">
            NovaSprout Learning makes tutoring simple: book a free demo class, choose a subject,
            meet online, and get notes or practice after the session.
          </p>
          <div className="hero-highlights" aria-label="Tutoring benefits">
            <span>
              <CheckCircle2 aria-hidden="true" size={16} />
              Free demo first
            </span>
            <span>
              <CheckCircle2 aria-hidden="true" size={16} />
              Fit guarantee
            </span>
            <span>
              <CheckCircle2 aria-hidden="true" size={16} />
              Notes after lessons
            </span>
          </div>
          <div className="hero-actions">
            <TrackedLink className="button primary" eventName="book_meeting_click" href={bookingUrl} target="_blank">
              <CalendarCheck aria-hidden="true" size={18} />
              Book free demo class
            </TrackedLink>
            <a className="button secondary" href="/pricing">
              <CreditCard aria-hidden="true" size={18} />
              View pricing
            </a>
          </div>
        </div>
        <div className="hero-media" aria-label="Seed growing in a nourishing learning environment">
          <img
            alt="A seed nourished in healthy soil growing into a bright young plant"
            src="/novasprout-hero.png"
          />
          <div className="hero-note">
            <Sparkles aria-hidden="true" size={18} />
            <span>Simple lessons, clear practice, and a free first demo class.</span>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Program highlights">
        <div>
          <strong>Free demo first</strong>
          <span>Try the format before choosing a plan</span>
        </div>
        <div>
          <strong>Live online tutoring</strong>
          <span>Meet through Google Meet or Zoom</span>
        </div>
        <div>
          <strong>Notes and practice</strong>
          <span>Helpful follow-up after sessions</span>
        </div>
      </section>

      <section className="section" id="subjects">
        <div className="section-heading">
          <p className="eyebrow">Subjects</p>
          <h2>Choose the help your student needs today.</h2>
        </div>
        <div className="subject-grid">
          {subjectTracks.map((subject) => (
            <a className="subject-card" href={`/${subject.slug}`} key={subject.title}>
              <span className="subject-icon">
                <subject.icon aria-hidden="true" size={28} />
              </span>
              <h3>{subject.title}</h3>
              <p>{subject.summary}</p>
              <span className="subject-level">{subject.level}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="section support-section">
        <div className="section-heading">
          <p className="eyebrow">Best for</p>
          <h2>Focused tutoring for the moments when students need a clearer path.</h2>
        </div>
        <div className="support-grid">
          {learningSituations.map((item) => (
            <article className="support-card" key={item.title}>
              <span className="subject-icon">
                <item.icon aria-hidden="true" size={24} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="process-section" id="how-it-works">
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2>Three easy steps from demo class to regular support.</h2>
        </div>
        <div className="steps wide-steps">
          {processSteps.map((step, index) => (
            <div className="step" key={step.title}>
              <span>{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section faq-section">
        <div className="section-heading">
          <p className="eyebrow">Questions</p>
          <h2>What families usually want to know before booking.</h2>
        </div>
        <div className="faq-grid">
          {tutoringFaqs.map((item) => (
            <article className="faq-item" key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="booking-section" id="book">
        <div className="booking-copy">
          <p className="eyebrow">Start</p>
          <h2>Start with the free demo class.</h2>
          <ul>
            <li>
              <CheckCircle2 aria-hidden="true" size={18} />
              Book one meeting and tell us the subject
            </li>
            <li>
              <CheckCircle2 aria-hidden="true" size={18} />
              Try the online tutoring format
            </li>
            <li>
              <CheckCircle2 aria-hidden="true" size={18} />
              Continue with a protected first paid session
            </li>
          </ul>
        </div>
        <div className="booking-actions">
          <TrackedLink className="button primary full" eventName="book_meeting_click" href={bookingUrl} target="_blank">
            Book free demo class
            <ArrowRight aria-hidden="true" size={18} />
          </TrackedLink>
          <a className="button secondary full" href="/pricing">
            View tutoring plans
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
