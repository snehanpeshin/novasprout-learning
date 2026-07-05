import { ArrowRight, CalendarCheck, CheckCircle2, Mail } from "lucide-react";
import Footer from "../components/Footer";
import { bookingUrl, studentRequestEmail, studentRequestSteps, subjectTracks } from "../site-data";

export const metadata = {
  title: "Find a Tutor | NovaSprout Learning",
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
          <a href="/become-a-tutor">Become a Tutor</a>
          <a className="nav-cta" href={bookingUrl} target="_blank" rel="noreferrer">
            Book free demo
          </a>
        </nav>
      </header>

      <section className="landing-hero compact-hero">
        <div>
          <p className="eyebrow">Find a tutor</p>
          <h1>Tell us what your student needs, and we will help match the right support.</h1>
          <p>
            Start with a quick request. We review the subject, grade level, goals, and schedule,
            then guide you toward a free demo or a tutor match.
          </p>
          <div className="hero-actions">
            <a className="button primary" href={studentRequestEmail}>
              Send student request
              <Mail aria-hidden="true" size={18} />
            </a>
            <a className="button secondary" href={bookingUrl} target="_blank" rel="noreferrer">
              Book free demo
              <CalendarCheck aria-hidden="true" size={18} />
            </a>
          </div>
        </div>
        <div className="landing-panel">
          <CheckCircle2 aria-hidden="true" size={42} />
          <h2>Curated matching first</h2>
          <p>No open marketplace yet. NovaSprout reviews requests so students get a thoughtful tutor suggestion.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">How matching starts</p>
          <h2>A simple request flow before we build full accounts.</h2>
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
          <h2>Send the request now, then we help with the next step.</h2>
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
          <a className="button primary full" href={studentRequestEmail}>
            Send student request
            <ArrowRight aria-hidden="true" size={18} />
          </a>
          <a className="button secondary full" href={bookingUrl} target="_blank" rel="noreferrer">
            Book free demo
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
