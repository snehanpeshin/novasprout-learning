import { ArrowRight, BookOpen } from "lucide-react";
import TrackedLink from "../components/TrackedLink";
import { bookingUrl, intakeForm, resourceItems, subjectTracks } from "../site-data";

export const metadata = {
  title: "Learning Resources | NovaSprout Learning",
  description: "Starter online tutoring resources, video topics, notes, worksheets, and practice ideas from NovaSprout Learning."
};

export default function ResourcesPage() {
  return (
    <main className="landing-page">
      <header className="site-header">
        <a className="brand" href="/" aria-label="NovaSprout Learning home">
          <span className="brand-mark">N</span>
          <span>NovaSprout Learning</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="/#subjects">Subjects</a>
          <a href="/pricing">Pricing</a>
          <a href="/#book">Book</a>
        </nav>
      </header>

      <section className="landing-hero compact-hero">
        <div>
          <p className="eyebrow">Resources</p>
          <h1>Short videos, notes, and worksheets that support tutoring.</h1>
          <p>
            Start with simple resources students can actually use: short unlisted YouTube
            lessons, one-page notes, practice sheets, and parent-friendly follow-up.
          </p>
        </div>
        <div className="landing-panel">
          <BookOpen aria-hidden="true" size={42} />
          <h2>Resource format</h2>
          <p>5-8 minute lesson, one clear idea, one example, one common mistake, and a practice prompt.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Library plan</p>
          <h2>What we can publish first.</h2>
        </div>
        <div className="resource-grid">
          {resourceItems.map((item) => (
            <article key={item.title}>
              <item.icon aria-hidden="true" size={24} />
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
              <span className="mini-label">{item.track} · {item.type}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="split-section">
        <div className="section-heading">
          <p className="eyebrow">Subjects</p>
          <h2>Resources are organized by learning track.</h2>
        </div>
        <div className="tutor-list">
          {subjectTracks.map((track) => (
            <a className="tutor-card" href={`/${track.slug}`} key={track.slug}>
              <div className="avatar">{track.navTitle.slice(0, 2)}</div>
              <div>
                <h3>{track.title}</h3>
                <p>{track.summary}</p>
                <div className="tag-row">
                  <span>{track.level}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="booking-section">
        <div className="booking-copy">
          <p className="eyebrow">Next step</p>
          <h2>Use resources with live support.</h2>
        </div>
        <div className="booking-actions">
          <TrackedLink className="button primary full" eventName="book_meeting_click" href={bookingUrl} target="_blank">
            Book a meeting
            <ArrowRight aria-hidden="true" size={18} />
          </TrackedLink>
          <TrackedLink className="button secondary full" eventName="intake_form_click" href={intakeForm} target="_blank">
            Complete intake form
          </TrackedLink>
        </div>
      </section>
    </main>
  );
}
