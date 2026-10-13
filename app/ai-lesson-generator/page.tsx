import { ArrowRight, CalendarCheck } from "lucide-react";
import AILessonGenerator from "../components/AILessonGenerator";
import LessonVideoPilot from "../components/LessonVideoPilot";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";
import TrackedLink from "../components/TrackedLink";

export const metadata = {
  title: "AI Study Tool | NovaSprout Learning",
  description:
    "Create a personalized visual study lesson and scored quiz with NovaSprout's optional AI learning tool.",
  alternates: { canonical: "/ai-lesson-generator" }
};

export default function AILessonGeneratorPage() {
  return (
    <main className="landing-page ns-site ns-ai-tutor-page">
      <SiteHeader />

      <section className="ai-tutor-hero">
        <div className="ai-tutor-hero-copy">
        <p className="eyebrow">NovaSprout AI Tutor</p>
        <h1>Tell us what you want to learn.</h1>
        <p>Choose a grade, subject, and topic. NovaSprout creates the explanation, visual learning, practice, and quiz.</p>
        <div className="hero-actions">
          <a className="button primary" href="#generator">
            Create a Lesson
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
