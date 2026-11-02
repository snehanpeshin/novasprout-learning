import { ArrowRight, CalendarCheck } from "lucide-react";
import AILessonGenerator from "../components/AILessonGenerator";
import LessonVideoPilot from "../components/LessonVideoPilot";
import MasteryLearningApproach from "../components/MasteryLearningApproach";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";
import TrackedLink from "../components/TrackedLink";

export const metadata = {
  title: "NovaSprout Clear | Your AI Tutor",
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
        <p className="eyebrow">NovaSprout Clear · Your AI tutor</p>
        <h1>Make the difficult part click.</h1>
        <p>Choose a grade, subject, and topic. NovaSprout Clear guides you through a short explanation, your own attempt, targeted feedback, and fresh checks. Save the lesson to review tomorrow.</p>
        <div className="hero-actions">
          <a className="button primary" href="#generator">
            Clarify a concept
            <ArrowRight aria-hidden="true" size={18} />
          </a>
          <a className="button secondary" href="/ai-lesson-generator?sample=1#generator">Explore the free sample</a>
        </div>
        </div>
        <img className="clear-hero-art" src="/novasprout-clear-crayon-hero.png" alt="Two children learning together with crayons and a friendly sprout character" />
      </section>

      <div id="generator">
        <AILessonGenerator />
      </div>

      <details className="ai-video-preview"><summary>See a 34-second sample video lesson</summary><LessonVideoPilot /></details>

      <section className="booking-section ai-tutor-help">
        <div className="booking-copy">
          <p className="eyebrow">Need human help?</p>
          <h2>Want extra human support?</h2>
          <p>The AI tutor works independently. If you want a person to help with a persistent gap or learning plan, you can request human tutoring separately.</p>
        </div>
        <div className="booking-actions">
          <TrackedLink className="button primary full" eventName="human_support_click" href="/human-tutoring">
            <CalendarCheck aria-hidden="true" size={18} />
            Explore optional human support
            <ArrowRight aria-hidden="true" size={18} />
          </TrackedLink>
        </div>
      </section>

      <MasteryLearningApproach />
      <Footer />
    </main>
  );
}
