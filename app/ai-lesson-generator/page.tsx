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

      <section className="ns-tutor-intro"><p className="eyebrow">NovaSprout Clear · Your AI tutor</p><h1>Press play. See the idea.</h1><p>Watch a short animation, then create a lesson on your own topic.</p></section>
      <section className="ns-feature-player" aria-label="Try the animated tutor"><LessonVideoPilot compact /></section>
      <div id="generator">
        <AILessonGenerator />
      </div>



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
