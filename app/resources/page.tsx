import { BookOpen, CalendarCheck } from "lucide-react";
import Footer from "../components/Footer";
import { bookingUrl, resourceItems } from "../site-data";

export const metadata = {
  title: "Learning Resources | NovaSprout Learning",
  description: "Starter online tutoring resources, video topics, notes, worksheets, and practice ideas from NovaSprout Learning."
};

export default function ResourcesPage() {
  return (
    <main className="landing-page">
      <header className="site-header">
        <a className="brand" href="/" aria-label="NovaSprout Learning home">
          <img className="brand-logo" src="/novasprout-logo.png" alt="" />
          <span>NovaSprout Learning</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/#subjects">Subjects</a>
          <a href="/pricing">Pricing</a>
          <a href="/#book">Book a Free Demo</a>
        </nav>
      </header>

      <section className="demo-strip" aria-label="Free demo class announcement">
        <div className="demo-track">
          <span>First demo class free</span>
          <span>Short videos and notes coming soon</span>
          <span>Learn online with practice support</span>
          <span>First demo class free</span>
          <span>Short videos and notes coming soon</span>
          <span>Learn online with practice support</span>
        </div>
      </section>

      <section className="landing-hero compact-hero">
        <div>
          <p className="eyebrow">Resources</p>
          <h1>Short videos, notes, and worksheets that support tutoring.</h1>
          <p>
            Start with simple resources students can actually use: short unlisted YouTube
            lessons, one-page notes, practice sheets, and clear follow-up after class. Public
            PDF and document previews will be added after each resource is ready.
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
