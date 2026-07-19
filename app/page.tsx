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
          <span>Request a live tutor only when the AI lesson shows where help is needed</span>
          <span>Free, Student, Student Plus, and Family AI Tutor plans</span>
          <span>AI tutor launch: personalized lesson decks, live tutoring, timed quiz</span>
          <span>Request a live tutor only when the AI lesson shows where help is needed</span>
          <span>Free, Student, Student Plus, and Family AI Tutor plans</span>
        </div>
      </section>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">AI tutor launch</p>
          <h1>Personalized AI Tutoring With Live Tutor Help When Needed.</h1>
          <p className="hero-text">
            NovaSprout Learning starts with AI-generated lessons, visuals, timed quizzes, and study
            notes. If the student gets stuck, they can request a live tutor who receives the topic,
            lesson history, quiz results, and weak areas.
          </p>
          <div className="hero-highlights" aria-label="Tutoring benefits">
            <span>
              <CheckCircle2 aria-hidden="true" size={16} />
              Personalized AI lessons
            </span>
            <span>
              <CheckCircle2 aria-hidden="true" size={16} />
              Visual PDF decks
            </span>
            <span>
              <CheckCircle2 aria-hidden="true" size={16} />
              Timed quiz and score
            </span>
            <span>
              <CheckCircle2 aria-hidden="true" size={16} />
              Live tutor escalation
            </span>
          </div>
          <div className="hero-actions">
            <a className="button primary" href="/ai-lesson-generator">
              Start AI Tutor
              <ArrowRight aria-hidden="true" size={18} />
            </a>
            <TrackedLink className="button primary" eventName="book_meeting_click" href={bookingUrl} target="_blank">
              <CalendarCheck aria-hidden="true" size={18} />
              Request Live Tutor
            </TrackedLink>
            <a className="button secondary" href="/pricing">
              View AI Plans
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
          <h2>From AI lesson to live tutor only when needed.</h2>
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
          <h2>AI Tutor plans first, with live tutoring as an optional escalation.</h2>
          <p>
            Start with a free AI Tutor plan, upgrade for more lessons and reports, and request a live
            tutor only when the student needs human guidance.
          </p>
        </div>
        <div className="pricing-grid">
          <article className="price-card">
            <h3>Free AI Tutor</h3>
            <strong>Free</strong>
            <p>Limited monthly AI lessons, basic explanations, quizzes, notes, and live tutor request option.</p>
            <a className="button primary full" href="/ai-lesson-generator">
              Start AI Tutor
            </a>
          </article>
          <article className="price-card">
            <h3>Student AI Tutor</h3>
            <strong>$9.99-$14.99 / month</strong>
            <p>More AI lessons, interactive quizzes, PDFs, worksheets, and saved lesson history.</p>
            <a className="button secondary full" href="/pricing">
              View Student Plan
            </a>
          </article>
          <article className="price-card">
            <h3>Student Plus</h3>
            <strong>$19.99-$29.99 / month</strong>
            <p>Higher AI lesson allowance, all subjects, adaptive quizzes, and progress reports.</p>
            <a className="button secondary full" href="/pricing">
              View Plus Plan
            </a>
          </article>
          <article className="price-card">
            <h3>Live Tutor Request</h3>
            <strong>$40-$60 / hour</strong>
            <p>Optional human help after the AI lesson identifies weak areas and next steps.</p>
            <a className="button secondary full" href="/ai-lesson-generator">
              Generate Lesson First
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
          <h2>Start With AI Tutor, Then Request Human Help When Needed.</h2>
          <p>
            Generate a lesson from grade, subject, topic, and learning goal. If the quiz or explanation
            shows a weak area, request a live tutor with the lesson context already prepared.
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
