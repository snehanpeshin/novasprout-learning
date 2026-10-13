import { ArrowRight, BookOpenCheck, CalendarCheck, GraduationCap, Timer } from "lucide-react";
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
        <h1>Create a personalized lesson in minutes.</h1>
        <p>Choose a topic. Get personalized explanations, narrated animations, and practice with feedback.</p>
        <div className="hero-actions">
          <a className="button primary" href="#generator">
            Create a Lesson
            <ArrowRight aria-hidden="true" size={18} />
          </a>
          <a className="button secondary" href="/portal">Find a tutor this week</a>
        </div>
        </div>
        <aside className="ai-tutor-hero-preview" aria-label="Visual lesson, practice, and quiz">
          <img src="/novasprout-ai-tutor-app-icon.png" alt="NovaSprout AI Tutor" width={112} height={112} />
          <p className="eyebrow">NovaSprout AI Tutor</p>
          <div><BookOpenCheck aria-hidden="true" /><span>Narrated learning</span></div>
          <div><GraduationCap aria-hidden="true" /><span>Guided practice</span></div>
          <div><Timer aria-hidden="true" /><span>Scored quiz</span></div>
        </aside>
      </section>

      <section className="ai-tutor-steps" id="how-ai-tutor-works" aria-label="How the AI Tutor works">
        <div>
          <GraduationCap aria-hidden="true" size={22} />
          <span>1</span>
          <p>Choose grade and topic</p>
        </div>
        <div>
          <BookOpenCheck aria-hidden="true" size={22} />
          <span>2</span>
          <p>Create your interactive lesson</p>
        </div>
        <div>
          <Timer aria-hidden="true" size={22} />
          <span>3</span>
          <p>Learn, practice, and take the quiz</p>
        </div>
      </section>

      <LessonVideoPilot />

      <div id="generator">
        <AILessonGenerator />
      </div>

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
