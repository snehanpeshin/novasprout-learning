import { ArrowRight, BookOpenCheck, CalendarCheck, GraduationCap, Timer } from "lucide-react";
import AILessonGenerator from "../components/AILessonGenerator";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";
import TrackedLink from "../components/TrackedLink";
import { bookingUrl } from "../site-data";

export const metadata = {
  title: "AI Study Tool | NovaSprout Learning",
  description:
    "Create a personalized visual study lesson and scored quiz with NovaSprout's optional AI learning tool.",
  alternates: { canonical: "/ai-lesson-generator" }
};

export default function AILessonGeneratorPage() {
  return (
    <main className="landing-page ns-site">
      <SiteHeader />

      <section className="ai-tutor-hero">
        <p className="eyebrow">NovaSprout AI Tutor</p>
        <h1>Create a personalized lesson in minutes.</h1>
        <p>Choose a topic. Get a visual lesson, guided practice, and a scored quiz.</p>
        <div className="hero-actions">
          <a className="button primary" href="#generator">
            Create a Lesson
            <ArrowRight aria-hidden="true" size={18} />
          </a>
          <a className="button secondary" href="/pricing">View Live Tutoring</a>
        </div>
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
          <p>Create the visual lesson</p>
        </div>
        <div>
          <Timer aria-hidden="true" size={22} />
          <span>3</span>
          <p>Learn, practice, and take the quiz</p>
        </div>
      </section>

      <div id="generator">
        <AILessonGenerator />
      </div>

      <section className="booking-section ai-tutor-help">
        <div className="booking-copy">
          <p className="eyebrow">Need human help?</p>
          <h2>Live Tutoring is also available.</h2>
          <p>It is a separate service, so students can book a human tutor without using the AI Tutor first.</p>
        </div>
        <div className="booking-actions">
          <TrackedLink className="button primary full" eventName="book_meeting_click" href={bookingUrl} target="_blank">
            <CalendarCheck aria-hidden="true" size={18} />
            Book a Free Demo
            <ArrowRight aria-hidden="true" size={18} />
          </TrackedLink>
        </div>
      </section>

      <Footer />
    </main>
  );
}
