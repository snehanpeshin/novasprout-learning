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
          <a href="/curriculum-demo">Curriculum</a>
          <a href="/ai-lesson-generator">AI Tutor</a>
          <a href="#how-it-works">How it works</a>
          <a href="/pricing">Pricing</a>
          <a href="#about">About</a>
          <TrackedLink className="nav-cta" eventName="book_meeting_click" href={bookingUrl} target="_blank">
            Book AI Tutor Demo
          </TrackedLink>
        </nav>
      </header>

      <section className="demo-strip" aria-label="NovaSprout AI tutor launch">
        <div className="demo-track">
          <span>AI tutor launch: personalized lesson decks, live tutoring, timed quiz</span>
          <span>Normal tutoring demo, 1-hour, and monthly plans available</span>
          <span>AI tutor locked by access code or approved paid email</span>
          <span>AI tutor launch: personalized lesson decks, live tutoring, timed quiz</span>
          <span>Normal tutoring demo, 1-hour, and monthly plans available</span>
          <span>AI tutor locked by access code or approved paid email</span>
        </div>
      </section>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">AI tutor launch</p>
          <h1>AI-Supported Online Tutoring With Live Human Guidance.</h1>
          <p className="hero-text">
            NovaSprout Learning keeps normal online tutoring simple: free demo, 1-hour sessions,
            and monthly plans. Approved users can also unlock AI-generated lesson decks, timed
            quizzes, guided practice, and follow-up notes.
          </p>
          <div className="hero-highlights" aria-label="Tutoring benefits">
            <span>
              <CheckCircle2 aria-hidden="true" size={16} />
              Live tutor guidance
            </span>
            <span>
              <CheckCircle2 aria-hidden="true" size={16} />
              AI-generated lesson decks
            </span>
            <span>
              <CheckCircle2 aria-hidden="true" size={16} />
              Timed quiz and score
            </span>
            <span>
              <CheckCircle2 aria-hidden="true" size={16} />
              Notes and practice after sessions
            </span>
          </div>
          <div className="hero-actions">
            <a className="button primary" href="/ai-lesson-generator">
              Unlock AI Tutor
              <ArrowRight aria-hidden="true" size={18} />
            </a>
            <TrackedLink className="button primary" eventName="book_meeting_click" href={bookingUrl} target="_blank">
              <CalendarCheck aria-hidden="true" size={18} />
              Book AI Tutor Demo
            </TrackedLink>
            <a className="button secondary" href="/pricing">
              View Tutoring Plans
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
            <span>AI-prepared lessons, live explanation, and a clearer next step after every session.</span>
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

      <section className="section curriculum-callout">
        <div className="section-heading">
          <p className="eyebrow">AI-generated tutoring</p>
          <h2>The new NovaSprout AI tutor prepares lessons students can actually use.</h2>
          <p>
            Students can generate a topic-based lesson deck, study through a timed PDF lesson,
            and unlock a quiz after guided learning time. Human tutors can use the same materials
            during live support.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="/ai-lesson-generator">
              Try AI Lesson Generator
              <ArrowRight aria-hidden="true" size={18} />
            </a>
            <a className="button secondary" href="/curriculum-demo">
              Explore Curriculum Demos
            </a>
          </div>
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
          <h2>Keep normal tutoring plans, with AI tutor access protected.</h2>
          <p>
            Start with a free demo, a 1-hour tutoring session, or a monthly tutoring plan. AI tutor
            tools stay locked behind an access code or approved paid-user email.
          </p>
        </div>
        <div className="pricing-grid">
          <article className="price-card">
            <h3>Free Tutoring Demo</h3>
            <strong>Free</strong>
            <p>A short online demo to discuss the student&apos;s needs, subject, schedule, and fit.</p>
            <TrackedLink className="button primary full" eventName="book_meeting_click" href={bookingUrl} target="_blank">
              Book Free Demo
            </TrackedLink>
          </article>
          <article className="price-card">
            <h3>1 Hour Tutoring</h3>
            <strong>$40-$60 / hour</strong>
            <p>One live online session for homework, concept clarity, test prep, or guided practice.</p>
            <a className="button secondary full" href="/pricing">
              View Checkout
            </a>
          </article>
          <article className="price-card">
            <h3>Monthly Tutoring Plan</h3>
            <strong>$199-$499 / month</strong>
            <p>Recurring tutoring based on subject, goals, frequency, and learning plan.</p>
            <a className="button secondary full" href="/pricing">
              View Monthly Plan
            </a>
          </article>
          <article className="price-card">
            <h3>Locked AI Tutor Access</h3>
            <strong>Code or approved email</strong>
            <p>AI lesson decks, timed quizzes, and study plans for approved users.</p>
            <a className="button secondary full" href="/ai-lesson-generator">
              Unlock AI Tutor
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
          <h2>Start With Tutoring, Then Unlock AI Support When Ready.</h2>
          <p>
            Book a demo, choose a 1-hour/monthly tutoring plan, or request AI access. Tell us the
            subject, grade or level, current challenge, and preferred schedule.
          </p>
          <ul>
            <li>
              <CheckCircle2 aria-hidden="true" size={18} />
              AI-generated lesson deck prepared around grade, subject, and topic
            </li>
            <li>
              <CheckCircle2 aria-hidden="true" size={18} />
              Live tutor support explains, guides, and adapts the material
            </li>
            <li>
              <CheckCircle2 aria-hidden="true" size={18} />
              Timed quiz, score, notes, and next-step practice
            </li>
          </ul>
        </div>
        <div className="booking-actions">
          <a className="button primary full" href="/pricing">
            View Tutoring Plans
            <ArrowRight aria-hidden="true" size={18} />
          </a>
          <TrackedLink className="button primary full" eventName="book_meeting_click" href={bookingUrl} target="_blank">
            Book AI Tutor Demo
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
