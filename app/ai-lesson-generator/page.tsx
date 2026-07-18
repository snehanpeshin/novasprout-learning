import { ArrowRight, Bot, CalendarCheck, CheckCircle2, ShieldCheck } from "lucide-react";
import AILessonGenerator from "../components/AILessonGenerator";
import Footer from "../components/Footer";
import TrackedLink from "../components/TrackedLink";
import { adminAutomationItems, aiTutoringWorkflow, bookingUrl } from "../site-data";

export const metadata = {
  title: "AI-Generated Tutoring | NovaSprout Learning",
  description:
    "Generate personalized tutoring lessons, study plans, and scored timed exams for NovaSprout Learning students."
};

export default function AILessonGeneratorPage() {
  return (
    <main className="landing-page">
      <header className="site-header">
        <a className="brand" href="/" aria-label="NovaSprout Learning home">
          <img className="brand-logo" src="/novasprout-logo.png" alt="" />
          <span>NovaSprout Learning</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="/#subjects">Subjects</a>
          <a href="/curriculum-demo">Curriculum</a>
          <a href="/#how-it-works">How it works</a>
          <a href="/pricing">Pricing</a>
          <TrackedLink className="nav-cta" eventName="book_meeting_click" href={bookingUrl} target="_blank">
            Book a Free Demo
          </TrackedLink>
        </nav>
      </header>

      <section className="landing-hero compact-hero">
        <div>
          <p className="eyebrow">AI-generated tutoring</p>
          <h1>Personalized lessons, study plans, and timed exams for online tutoring.</h1>
          <p>
            NovaSprout can use AI to prepare fresh tutoring material after login: full lessons,
            custom plans based on student questions, and scored practice exams. Human tutors remain
            central to live teaching and final guidance.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#generator">
              Try the Generator
              <ArrowRight aria-hidden="true" size={18} />
            </a>
            <TrackedLink className="button secondary" eventName="book_meeting_click" href={bookingUrl} target="_blank">
              <CalendarCheck aria-hidden="true" size={18} />
              Book a Free Demo
            </TrackedLink>
          </div>
        </div>
        <div className="landing-panel">
          <Bot aria-hidden="true" size={42} />
          <h2>What it generates</h2>
          <p>
            Demo sessions, comprehensive lessons, learning plans, practice questions, timed exams,
            instant scores, and parent/tutor notes.
          </p>
        </div>
      </section>

      <div id="generator">
        <AILessonGenerator />
      </div>

      <section className="split-section">
        <div>
          <p className="eyebrow">AI Tutor Support</p>
          <h2>Personalized support for preparation, practice, and follow-up.</h2>
          <p>
            The generator is a first step toward a larger NovaSprout workspace where AI helps create
            lesson plans and human tutors use them to guide live sessions.
          </p>
        </div>
        <div className="tutor-list">
          {aiTutoringWorkflow.map((item) => (
            <article className="tutor-card" key={item}>
              <span className="subject-icon">
                <CheckCircle2 aria-hidden="true" size={22} />
              </span>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Admin Automation Roadmap</p>
          <h2>Later, connect generated lessons to tutoring operations.</h2>
          <p>
            This first version does not save student records. The next platform layer can connect
            lessons to attendance, scheduling, payments, tutor notes, and parent reports.
          </p>
        </div>
        <div className="feature-grid">
          {adminAutomationItems.map((item) => (
            <article className="feature-card" key={item}>
              <ShieldCheck aria-hidden="true" size={22} />
              <h3>{item}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="booking-section">
        <div className="booking-copy">
          <p className="eyebrow">Use it with a tutor</p>
          <h2>Turn a generated sample into a live tutoring session.</h2>
          <p>
            If a generated lesson matches what your student needs, book a free demo and NovaSprout
            can confirm the right tutor, rate, and next step.
          </p>
        </div>
        <div className="booking-actions">
          <TrackedLink className="button primary full" eventName="book_meeting_click" href={bookingUrl} target="_blank">
            Book a Free Demo
            <ArrowRight aria-hidden="true" size={18} />
          </TrackedLink>
          <a className="button secondary full" href="/curriculum-demo">
            View Curriculum Demos
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
