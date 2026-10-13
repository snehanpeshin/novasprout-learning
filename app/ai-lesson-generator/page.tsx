import { ArrowRight, CalendarCheck } from "lucide-react";
import AILessonGenerator from "../components/AILessonGenerator";
import LessonVideoPilot from "../components/LessonVideoPilot";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";
import TrackedLink from "../components/TrackedLink";

export const metadata = {
  title: "NovaSprout Clear | AI Concept Guide",
  description:
    "NovaSprout Clear creates short, visual AI concept guides with practice and a quick check for understanding.",
  alternates: { canonical: "/ai-lesson-generator" }
};

export default function AILessonGeneratorPage() {
  return (
    <main className="landing-page ns-site ns-ai-tutor-page">
      <SiteHeader />

      <section className="ai-tutor-hero">
        <div className="ai-tutor-hero-copy">
        <p className="eyebrow">NovaSprout Clear · AI concept guide</p>
        <h1>Make the difficult part click.</h1>
        <p>Choose a grade, subject, and topic. NovaSprout Clear creates a short visual explanation, practice, and a quick check.</p>
        <div className="hero-actions">
          <a className="button primary" href="#generator">
            Clarify a concept
            <ArrowRight aria-hidden="true" size={18} />
          </a>
          <a className="button secondary" href="/portal">Find a tutor this week</a>
        </div>
        </div>
      </section>

      <div id="generator">
        <AILessonGenerator />
      </div>

      <details className="ai-video-preview"><summary>See a 34-second sample video lesson</summary><LessonVideoPilot /></details>

      <section className="booking-section ai-tutor-help">
        <div className="booking-copy">
          <p className="eyebrow">Need human help?</p>
          <h2>Need a tutor for this week?</h2>
          <p>Send the subject, deadline, and available times through the family portal. You can keep learning here while NovaSprout reviews the live-tutor fit.</p>
        </div>
        <div className="booking-actions">
          <TrackedLink className="button primary full" eventName="tutor_portal_click" href="/portal">
            <CalendarCheck aria-hidden="true" size={18} />
            Find a tutor fast
            <ArrowRight aria-hidden="true" size={18} />
          </TrackedLink>
        </div>
      </section>

      <Footer />
    </main>
  );
}
