"use client";

import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Mail,
  Sparkles
} from "lucide-react";
import Footer from "./components/Footer";
import TrackedLink from "./components/TrackedLink";
import {
  audiencePathways,
  bookingUrl,
  contactEmail,
  learningSituations,
  matchingSteps,
  processSteps,
  sessionDeliverables,
  subjectTracks,
  tutoringFaqs
} from "./site-data";

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
          <a href="#how-it-works">How it works</a>
          <a href="/pricing">Pricing</a>
          <a href="#about">About</a>
          <TrackedLink className="nav-cta" eventName="book_meeting_click" href={bookingUrl} target="_blank">
            Book a Free Demo
          </TrackedLink>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Personalized online tutoring</p>
          <h1>Personalized Online Tutoring That Makes Difficult Subjects Clearer.</h1>
          <p className="hero-text">
            NovaSprout Learning connects students with friendly online support in math, science,
            coding, and study skills, starting with a free introductory session.
          </p>
          <div className="hero-highlights" aria-label="Tutoring benefits">
            <span>
              <CheckCircle2 aria-hidden="true" size={16} />
              Live online lessons
            </span>
            <span>
              <CheckCircle2 aria-hidden="true" size={16} />
              Personalized support
            </span>
            <span>
              <CheckCircle2 aria-hidden="true" size={16} />
              Notes and practice after sessions
            </span>
          </div>
          <div className="hero-actions">
            <TrackedLink className="button primary" eventName="book_meeting_click" href={bookingUrl} target="_blank">
              <CalendarCheck aria-hidden="true" size={18} />
              Book a Free Demo
            </TrackedLink>
            <a className="button secondary" href="#subjects">
              Explore Subjects
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
            <span>Friendly, personalized online tutoring for school-age students and growing learners.</span>
          </div>
        </div>
      </section>

      <section className="section support-section" id="who-we-help">
        <div className="section-heading">
          <p className="eyebrow">Who NovaSprout helps</p>
          <h2>Focused support for students who need a clearer next step.</h2>
        </div>
        <div className="support-grid audience-grid">
          {audiencePathways.map((pathway) => (
            <article className="support-card" key={pathway.title}>
              <span className="subject-icon">
                <pathway.icon aria-hidden="true" size={24} />
              </span>
              <h3>{pathway.title}</h3>
              <p>{pathway.copy}</p>
            </article>
          ))}
        </div>
        <p className="secondary-pathway">
          Looking for coding or data-skills mentoring for a teen, college student, or adult?{" "}
          <a href="/coding-data-skills">Explore Coding and Data Skills</a>.
        </p>
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
              <span className="learn-more">Learn More</span>
            </a>
          ))}
        </div>
      </section>

      <section className="section support-section">
        <div className="section-heading">
          <p className="eyebrow">When tutoring can help</p>
          <h2>Practical support for common school and study moments.</h2>
        </div>
        <div className="support-grid situation-grid">
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
          <h2>From request to live online support.</h2>
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

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">What students receive</p>
          <h2>Clear explanation, guided practice, and a useful next step.</h2>
        </div>
        <div className="feature-grid">
          {sessionDeliverables.map((item) => (
            <article className="feature-card" key={item}>
              <CheckCircle2 aria-hidden="true" size={22} />
              <h3>{item}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="split-section" id="about">
        <div>
          <p className="eyebrow">Why families choose NovaSprout</p>
          <h2>Simple online tutoring with a reviewed matching approach.</h2>
          <p>
            NovaSprout Learning provides online tutoring through a growing network of carefully
            reviewed tutors. Students begin by sharing their subject, level, and goals. NovaSprout
            then confirms the most appropriate tutor and next step.
          </p>
          <a className="text-link" href="/refund-policy">Read the fit guarantee and refund policy</a>
        </div>
        <div className="tutor-list">
          {matchingSteps.map((step) => (
            <article className="tutor-card" key={step}>
              <span className="subject-icon">
                <CheckCircle2 aria-hidden="true" size={22} />
              </span>
              <p>{step}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section compact-section" id="pricing-summary">
        <div className="section-heading">
          <p className="eyebrow">Pricing summary</p>
          <h2>Start free, then confirm the right rate and plan.</h2>
          <p>
            Public prices are a guide. The final rate, tutor, schedule, and payment link are confirmed
            before a paid session or recurring plan.
          </p>
        </div>
        <div className="pricing-grid">
          <article className="price-card">
            <h3>Free Demo</h3>
            <strong>Free</strong>
            <p>A short introductory session to discuss the student&apos;s needs and experience the format.</p>
            <TrackedLink className="button primary full" eventName="book_meeting_click" href={bookingUrl} target="_blank">
              Book a Free Demo
              <ArrowRight aria-hidden="true" size={18} />
            </TrackedLink>
          </article>
          <article className="price-card">
            <h3>Individual Tutoring</h3>
            <strong>$40-$60 per hour</strong>
            <p>One live online session with follow-up notes or practice. Rate is confirmed before booking.</p>
            <a className="button secondary full" href="/pricing">
              Confirm Availability
            </a>
          </article>
          <article className="price-card">
            <h3>Ongoing Tutoring</h3>
            <strong>Custom monthly plan</strong>
            <p>Recurring support based on subject, goals, frequency, and tutor availability.</p>
            <a className="button secondary full" href="/pricing">
              Discuss a Tutoring Plan
            </a>
          </article>
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
          <h2>Help Your Student Take the Next Clear Step.</h2>
          <p>
            Tell us the subject, grade or level, current challenge, and preferred schedule. We&apos;ll
            help determine the right tutoring option.
          </p>
          <ul>
            <li>
              <CheckCircle2 aria-hidden="true" size={18} />
              Subject, grade or level, and goals reviewed first
            </li>
            <li>
              <CheckCircle2 aria-hidden="true" size={18} />
              Tutor, rate, and schedule confirmed before payment
            </li>
            <li>
              <CheckCircle2 aria-hidden="true" size={18} />
              Follow-up notes or practice after lessons
            </li>
          </ul>
        </div>
        <div className="booking-actions">
          <TrackedLink className="button primary full" eventName="book_meeting_click" href={bookingUrl} target="_blank">
            Book a Free Demo
            <ArrowRight aria-hidden="true" size={18} />
          </TrackedLink>
          <a className="button secondary full" href={`mailto:${contactEmail}`}>
            <Mail aria-hidden="true" size={18} />
            Ask a Question
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
