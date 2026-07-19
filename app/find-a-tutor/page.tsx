import { ArrowRight, CalendarCheck, CheckCircle2, Mail } from "lucide-react";
import Footer from "../components/Footer";
import { bookingUrl, contactEmail, studentRequestEmail, studentRequestSteps, subjectTracks } from "../site-data";

export const metadata = {
  title: "Request a Tutor | NovaSprout Learning",
  description:
    "Request a NovaSprout Learning tutor for math, science, coding, data skills, and study support."
};

export default function FindATutorPage() {
  return (
    <main className="landing-page">
      <header className="site-header">
        <a className="brand" href="/" aria-label="NovaSprout Learning home">
          <img className="brand-logo" src="/novasprout-logo.png" alt="" />
          <span>NovaSprout Learning</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="/#subjects">Subjects</a>
          <a href="/ai-lesson-generator">AI Tutor</a>
          <a href="/pricing">Pricing</a>
          <a href="/become-a-tutor">Become a Tutor</a>
          <a className="nav-cta" href={bookingUrl} target="_blank" rel="noreferrer">
            Book a Free Demo
          </a>
        </nav>
      </header>

      <section className="landing-hero compact-hero">
        <div>
          <p className="eyebrow">Live tutoring</p>
          <h1>Learn online, one-to-one, with a human tutor.</h1>
          <p>
            Book a free live demo or send a tutoring request. We review the subject, grade level,
            goals, and schedule, then help match the student with suitable support. AI Tutor access
            is not required.
          </p>
          <div className="hero-actions">
            <a className="button primary" href={bookingUrl} target="_blank" rel="noreferrer">
              Book Free Live Demo
              <CalendarCheck aria-hidden="true" size={18} />
            </a>
            <a className="button secondary" href={studentRequestEmail}>
              Send Tutoring Request
              <Mail aria-hidden="true" size={18} />
            </a>
          </div>
        </div>
        <div className="landing-panel">
          <CheckCircle2 aria-hidden="true" size={42} />
          <h2>Live human support</h2>
          <p>Students receive direct explanation, guided practice, and a plan for what to work on next.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">How live tutoring starts</p>
          <h2>Book a demo or tell us what the student needs.</h2>
        </div>
        <div className="support-grid">
          {studentRequestSteps.map((step) => (
            <article className="support-card" key={step.title}>
              <span className="subject-icon">
                <step.icon aria-hidden="true" size={24} />
              </span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="resources-section">
        <div className="section-heading">
          <p className="eyebrow">Available areas</p>
          <h2>Request help in one of our starting tutoring tracks.</h2>
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

      <section className="booking-section">
        <div className="booking-copy">
          <p className="eyebrow">Start</p>
          <h2>Meet a tutor before choosing paid sessions.</h2>
          <ul>
            <li>
              <CheckCircle2 aria-hidden="true" size={18} />
              Subject, grade, and goals reviewed first
            </li>
            <li>
              <CheckCircle2 aria-hidden="true" size={18} />
              Free demo available before paid tutoring
            </li>
            <li>
              <CheckCircle2 aria-hidden="true" size={18} />
              First paid session fit guarantee
            </li>
          </ul>
        </div>
        <div className="booking-actions">
          <a className="button primary full" href={bookingUrl} target="_blank" rel="noreferrer">
            Book Free Live Demo
            <CalendarCheck aria-hidden="true" size={18} />
          </a>
          <a className="button secondary full" href={studentRequestEmail}>
            Send Tutoring Request
            <ArrowRight aria-hidden="true" size={18} />
          </a>
          <a className="text-link" href={`mailto:${contactEmail}`}>
            Ask a question by email
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
