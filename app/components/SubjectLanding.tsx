import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import PricingOptions from "./PricingOptions";
import TrackedLink from "./TrackedLink";
import { bookingUrl, intakeForm, subjectTracks } from "../site-data";

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
          <span className="brand-mark">N</span>
          <span>NovaSprout Learning</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="/#subjects">Subjects</a>
          <a href="/resources">Resources</a>
          <a href="/pricing">Pricing</a>
          <a href="/#book">Book</a>
        </nav>
      </header>

      <section className="landing-hero">
        <div>
          <p className="eyebrow">{subject.level}</p>
          <h1>{subject.hero}</h1>
          <p>{subject.copy}</p>
          <div className="hero-actions">
            <TrackedLink className="button primary" eventName="book_meeting_click" href={bookingUrl} target="_blank">
              Book a free consultation
              <ArrowRight aria-hidden="true" size={18} />
            </TrackedLink>
            <TrackedLink className="button secondary" eventName="intake_form_click" href={intakeForm} target="_blank">
              Student intake form
              <BookOpen aria-hidden="true" size={18} />
            </TrackedLink>
          </div>
        </div>
        <div className="landing-panel">
          <subject.icon aria-hidden="true" size={42} />
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
              <CheckCircle2 aria-hidden="true" size={20} />
              <h3>{outcome}</h3>
              <p>Clear explanation, guided practice, and a small follow-up step after tutoring.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section compact-section">
        <div className="section-heading">
          <p className="eyebrow">Choose support</p>
          <h2>Pick one of three simple options.</h2>
        </div>
        <PricingOptions />
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
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
