import { CheckCircle2 } from "lucide-react";
import Footer from "../components/Footer";
import PricingOptions from "../components/PricingOptions";

export const metadata = {
  title: "AI Tutor Plans | NovaSprout Learning",
  description:
    "Review NovaSprout Learning AI Tutor plans, with optional live tutor requests when students need human help."
};

export default function PricingPage() {
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
          <a href="/#book">Contact</a>
        </nav>
      </header>

      <section className="demo-strip" aria-label="AI tutor launch announcement">
        <div className="demo-track">
          <span>AI tutor launch: generated lessons, live explanation, timed quiz</span>
          <span>Live tutor request available when students need human help</span>
          <span>Free, Student, Student Plus, and Family AI Tutor plans</span>
          <span>AI tutor launch: generated lessons, live explanation, timed quiz</span>
          <span>Live tutor request available when students need human help</span>
          <span>Free, Student, Student Plus, and Family AI Tutor plans</span>
        </div>
      </section>

      <section className="landing-hero compact-hero">
        <div>
          <p className="eyebrow">Pricing</p>
          <h1>AI Tutor is the core product. Live tutoring is available when students need more help.</h1>
          <p>
            Students generate personalized lessons, study the deck, take a timed quiz, and then request
            a live tutor only when they need direct human support.
          </p>
        </div>
        <div className="landing-panel">
          <CheckCircle2 aria-hidden="true" size={42} />
          <h2>AI-first learning</h2>
          <p>Lesson history, quiz results, and weak areas can be sent with a live tutor request.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Options</p>
          <h2>Choose an AI Tutor plan, then add live tutoring only when needed.</h2>
          <p>
            AI subscriptions can start as manual approvals while pricing is tested. Live tutor requests
            remain separate from the digital subscription.
          </p>
        </div>
        <PricingOptions />
      </section>

      <Footer />
    </main>
  );
}
