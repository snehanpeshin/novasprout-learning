import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import Footer from "../components/Footer";
import { contactEmail, subjectTracks, tutorApplicationEmail, tutorApplicationSteps } from "../site-data";

export const metadata = {
  title: "Become a Tutor | NovaSprout Learning",
  description:
    "Apply to tutor with NovaSprout Learning across math, science, coding, data skills, and study support."
};

export default function BecomeATutorPage() {
  return (
    <main className="landing-page">
      <header className="site-header">
        <a className="brand" href="/" aria-label="NovaSprout Learning home">
          <img className="brand-logo" src="/novasprout-logo.png" alt="" />
          <span>NovaSprout Learning</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="/find-a-tutor">Live Tutoring</a>
          <a href="/ai-lesson-generator">AI Tutor</a>
          <a href="/#subjects">Subjects</a>
          <a href="/pricing">Pricing</a>
        </nav>
      </header>

      <section className="landing-hero compact-hero">
        <div>
          <p className="eyebrow">Become a tutor</p>
          <h1>Join NovaSprout as a carefully reviewed online tutor.</h1>
          <p>
            We are starting as a curated tutoring platform. Tutors apply first, then NovaSprout
            matches approved tutors with student requests when subject, level, and schedule fit.
          </p>
          <div className="hero-actions">
            <a className="button primary" href={tutorApplicationEmail}>
              Apply by email
              <Mail aria-hidden="true" size={18} />
            </a>
            <a className="button secondary" href="/find-a-tutor">
              See student request flow
            </a>
          </div>
        </div>
        <div className="landing-panel">
          <CheckCircle2 aria-hidden="true" size={42} />
          <h2>Quality before marketplace</h2>
          <p>We are not opening unlimited tutor profiles yet. The first version is reviewed and matched by NovaSprout.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Tutor onboarding</p>
          <h2>A simple application flow while the platform grows.</h2>
        </div>
        <div className="support-grid">
          {tutorApplicationSteps.map((step) => (
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
          <p className="eyebrow">Tutor areas</p>
          <h2>We are prioritizing tutors in these starting tracks.</h2>
        </div>
        <div className="subject-grid">
          {subjectTracks.map((subject) => (
            <article className="subject-card" key={subject.title}>
              <span className="subject-icon">
                <subject.icon aria-hidden="true" size={28} />
              </span>
              <h3>{subject.title}</h3>
              <p>{subject.summary}</p>
              <span className="subject-level">{subject.level}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="booking-section">
        <div className="booking-copy">
          <p className="eyebrow">Apply</p>
          <h2>Send a short tutor application.</h2>
          <ul>
            <li>
              <CheckCircle2 aria-hidden="true" size={18} />
              Subjects and grade levels you can support
            </li>
            <li>
              <CheckCircle2 aria-hidden="true" size={18} />
              Weekly availability and tutoring experience
            </li>
            <li>
              <CheckCircle2 aria-hidden="true" size={18} />
              Resume, LinkedIn, or intro video link if available
            </li>
          </ul>
        </div>
        <div className="booking-actions">
          <a className="button primary full" href={tutorApplicationEmail}>
            Apply to tutor
            <ArrowRight aria-hidden="true" size={18} />
          </a>
          <a className="button secondary full" href={`mailto:${contactEmail}`}>
            Email a question
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
