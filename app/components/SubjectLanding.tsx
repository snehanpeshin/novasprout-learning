import { ArrowRight, CalendarCheck, CheckCircle2, CreditCard } from "lucide-react";
import Footer from "./Footer";
import TrackedLink from "./TrackedLink";
import { bookingUrl, subjectTracks } from "../site-data";

type SubjectLandingProps = {
  slug: string;
};

export default function SubjectLanding({ slug }: SubjectLandingProps) {
  const subject = subjectTracks.find((track) => track.slug === slug);

  if (!subject) {
    return null;
  }

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
          <a href="/find-a-tutor">Live Tutoring</a>
          <a href="/pricing">Pricing</a>
        </nav>
      </header>

      <section className="demo-strip" aria-label="Free demo class announcement">
        <div className="demo-track">
          <span>First demo class free</span>
          <span>First paid session fit guarantee</span>
          <span>Live lesson plus practice notes</span>
          <span>First demo class free</span>
          <span>First paid session fit guarantee</span>
          <span>Live lesson plus practice notes</span>
        </div>
      </section>

      <section className="landing-hero">
        <div>
          <p className="eyebrow">{subject.level}</p>
          <h1>{subject.hero}</h1>
          <p>{subject.copy}</p>
          <div className="hero-actions">
            <TrackedLink className="button primary" eventName="book_meeting_click" href={bookingUrl} target="_blank">
              Book a Free Demo
              <ArrowRight aria-hidden="true" size={18} />
            </TrackedLink>
            <a className="button secondary" href="/pricing">
              <CreditCard aria-hidden="true" size={18} />
              View pricing
            </a>
          </div>
        </div>
        <div className="landing-panel">
          <span className="subject-icon subject-icon-large">
            <subject.icon aria-hidden="true" size={40} />
          </span>
          <h2>{subject.title}</h2>
          <p>{subject.summary}</p>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">What we cover</p>
          <h2>Focused topics for steady progress.</h2>
        </div>
        <div className="feature-grid">
          {subject.outcomes.map((outcome) => (
            <article className="feature-card" key={outcome}>
              <CheckCircle2 aria-hidden="true" size={22} />
              <h3>{outcome}</h3>
              <p>Clear explanation, guided practice, and a small follow-up step after tutoring.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section compact-section">
        <div className="section-heading">
          <p className="eyebrow">Pricing pathway</p>
          <h2>Start with the free demo, then confirm the right rate.</h2>
          <p>
            Individual sessions are currently listed at $40-$60 per hour, with the final tutor,
            schedule, and payment link confirmed before booking.
          </p>
          <a className="button secondary" href="/pricing">
            <CreditCard aria-hidden="true" size={18} />
            View pricing details
          </a>
        </div>
      </section>

      <section className="resources-section">
        <div className="section-heading">
          <p className="eyebrow">Starter resources</p>
          <h2>Short videos and notes we can build around.</h2>
        </div>
        <div className="resource-grid">
          {subject.resources.map((resource) => (
            <article key={resource}>
              <subject.icon aria-hidden="true" size={24} />
              <h3>{resource}</h3>
              <p>Use this as a quick lesson, practice prompt, or tutoring follow-up note.</p>
              <span className="mini-label">Coming soon</span>
              <a
                className="resource-action"
                href={bookingUrl}
                target="_blank"
                rel="noreferrer"
              >
                <CalendarCheck aria-hidden="true" size={16} />
                Discuss in free demo
              </a>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
