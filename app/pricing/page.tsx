import { CheckCircle2 } from "lucide-react";
import Footer from "../components/Footer";
import PricingOptions from "../components/PricingOptions";

export const metadata = {
  title: "Tutoring Pricing | NovaSprout Learning",
  description:
    "Review NovaSprout Learning tutoring pricing, including a free demo, 1-hour tutoring, monthly plans, and locked AI tutor access."
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
          <span>Normal tutoring demo, 1-hour, and monthly plans available</span>
          <span>Protected AI tutor unlock by code or approved paid email</span>
          <span>AI tutor launch: generated lessons, live explanation, timed quiz</span>
          <span>Normal tutoring demo, 1-hour, and monthly plans available</span>
          <span>Protected AI tutor unlock by code or approved paid email</span>
        </div>
      </section>

      <section className="landing-hero compact-hero">
        <div>
          <p className="eyebrow">Pricing</p>
          <h1>Start with normal tutoring, then unlock AI tutor tools when approved.</h1>
          <p>
            Keep the simple tutoring pathway: free demo, 1-hour class, or monthly plan. The AI tutor
            remains protected and can be unlocked with an access code or approved paid-user email.
          </p>
        </div>
        <div className="landing-panel">
          <CheckCircle2 aria-hidden="true" size={42} />
          <h2>Locked AI tutor</h2>
          <p>AI lesson decks, timed quizzes, and generated study plans are available only after unlock.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Options</p>
          <h2>Demo, 1-hour tutoring, monthly tutoring, and protected AI access.</h2>
          <p>
            Use Stripe checkout for paid tutoring. Use the AI tutor page only if you have the access
            code or an approved paid-user email.
          </p>
        </div>
        <PricingOptions />
      </section>

      <Footer />
    </main>
  );
}
