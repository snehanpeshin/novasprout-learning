"use client";

import {
  ArrowRight,
  Bot,
  CalendarCheck,
  CheckCircle2,
  Mail,
  Phone,
  Sparkles,
  Video
} from "lucide-react";
import Footer from "./components/Footer";
import TrackedLink from "./components/TrackedLink";
import {
  audiencePathways,
  bookingUrl,
  contactEmail,
  contactPhone,
  contactPhoneHref,
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
          <a href="/ai-lesson-generator">AI Tutor</a>
          <a href="/find-a-tutor">Live Tutoring</a>
          <a href="/pricing">Pricing</a>
          <a href="/contact">Contact</a>
          <TrackedLink className="nav-cta" eventName="book_meeting_click" href={bookingUrl} target="_blank">
            Book Free Live Demo
          </TrackedLink>
        </nav>
      </header>

      <section className="demo-strip" aria-label="NovaSprout tutoring options">
        <div className="demo-track">
          <span>First live tutoring demo is free</span>
          <span>AI Tutor and Live Tutoring are separate services</span>
          <span>Personalized AI lessons, live human teaching, or both</span>
          <span>First live tutoring demo is free</span>
          <span>AI Tutor and Live Tutoring are separate services</span>
          <span>Personalized AI lessons, live human teaching, or both</span>
        </div>
      </section>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Two ways to learn online</p>
          <h1>Choose AI Lessons or Learn Live With a Tutor.</h1>
          <p className="hero-text">
            AI Tutor creates personalized lessons, visuals, practice, and timed quizzes. Live Tutoring
            connects students directly with a human tutor for one-to-one online teaching. Each service
            can be used on its own.
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
              One-to-one live tutoring
            </span>
          </div>
          <div className="hero-actions">
            <a className="button primary" href="/ai-lesson-generator">
              Try AI Tutor
              <ArrowRight aria-hidden="true" size={18} />
            </a>
            <a className="button secondary" href="/find-a-tutor">
              <Video aria-hidden="true" size={18} />
              Explore Live Tutoring
            </a>
            <TrackedLink className="button secondary" eventName="book_meeting_click" href={bookingUrl} target="_blank">
              <CalendarCheck aria-hidden="true" size={18} />
              Book Free Live Demo
            </TrackedLink>
          </div>
        </div>
        <div className="hero-media" aria-label="Children learning online with a tutor">
          <img
            alt="Crayon illustration of children learning math and science with an online tutor"
            src="/novasprout-crayon-hero.jpg"
          />
          <div className="hero-note">
            <Sparkles aria-hidden="true" size={18} />
            <span>Flexible online learning for independent study or direct human support.</span>
          </div>
        </div>
      </section>

      <section className="section service-choice-section" aria-labelledby="choose-service-title">
        <div className="section-heading">
          <p className="eyebrow">Choose a service</p>
          <h2 id="choose-service-title">Start with the type of tutoring you want.</h2>
          <p>No AI lesson is required before booking a live tutor.</p>
        </div>
        <div className="service-choice-grid">
          <article className="service-choice">
            <span className="subject-icon"><Bot aria-hidden="true" size={26} /></span>
            <div>
              <p className="eyebrow">Self-guided</p>
              <h3>AI Tutor</h3>
              <p>Generate a lesson by grade, subject, and topic, then study the slides and complete a timed quiz.</p>
              <a className="button primary" href="/ai-lesson-generator">
                Open AI Tutor
                <ArrowRight aria-hidden="true" size={18} />
              </a>
            </div>
          </article>
          <article className="service-choice">
            <span className="subject-icon"><Video aria-hidden="true" size={26} /></span>
            <div>
              <p className="eyebrow">One-to-one</p>
              <h3>Live Tutoring</h3>
              <p>Meet a human tutor online for personal explanation, guided practice, and ongoing academic support.</p>
              <a className="button primary" href="/find-a-tutor">
                Explore Live Tutoring
                <ArrowRight aria-hidden="true" size={18} />
              </a>
            </div>
          </article>
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
          <h2>Two services with simple starting points.</h2>
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
          <h2>Separate plans for AI Tutor and Live Tutoring.</h2>
          <p>
            Try the AI Tutor for independent study, or book a free live tutoring demo before choosing
            a one-hour session or monthly support.
          </p>
        </div>
        <div className="pricing-grid">
          <article className="price-card">
            <h3>Free AI Tutor</h3>
            <strong>Free</strong>
            <p>Limited monthly AI lessons with explanations, quizzes, notes, and PDF lesson previews.</p>
            <a className="button primary full" href="/ai-lesson-generator">
              Start AI Tutor
            </a>
          </article>
          <article className="price-card">
            <h3>Student AI Tutor</h3>
            <strong>$6 / month</strong>
            <p>More AI lessons, interactive quizzes, PDFs, worksheets, and saved lesson history.</p>
            <a className="button secondary full" href="/pricing">
              View Student Plan
            </a>
          </article>
          <article className="price-card">
            <h3>1-Hour Live Tutoring</h3>
            <strong>$20 / class</strong>
            <p>A focused one-to-one online lesson with personalized explanation and guided practice.</p>
            <a className="button secondary full" href="/pricing">
              View Live Tutoring
            </a>
          </article>
          <article className="price-card">
            <h3>Recurring Live Tutoring</h3>
            <strong>$20 / class</strong>
            <p>Schedule regular live sessions at the same flat rate, with practice and progress follow-up.</p>
            <TrackedLink className="button secondary full" eventName="book_meeting_click" href={bookingUrl} target="_blank">
              Book Free Demo
            </TrackedLink>
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
          <h2>Choose AI Tutor or Live Tutoring.</h2>
          <p>
            Open the AI Tutor for a personalized self-guided lesson, or book a free live demo to meet
            a human tutor. Neither service requires the other.
          </p>
          <ul>
            <li>
              <CheckCircle2 aria-hidden="true" size={18} />
              AI-generated lesson deck prepared around grade, subject, and topic
            </li>
            <li>
              <CheckCircle2 aria-hidden="true" size={18} />
              Live tutoring provides direct one-to-one explanation and guided practice
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
            Book Free Live Demo
            <ArrowRight aria-hidden="true" size={18} />
          </TrackedLink>
          <a className="button secondary full" href="/contact">
            <Mail aria-hidden="true" size={18} />
            Open Contact Form
          </a>
          <div className="contact-summary">
            <a href={`mailto:${contactEmail}`}><Mail aria-hidden="true" size={17} />{contactEmail}</a>
            <a href={contactPhoneHref}><Phone aria-hidden="true" size={17} />{contactPhone}</a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
