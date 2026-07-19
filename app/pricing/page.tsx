import { CheckCircle2 } from "lucide-react";
import Footer from "../components/Footer";
import PricingOptions from "../components/PricingOptions";

export const metadata = {
  title: "AI Tutor Pricing | NovaSprout Learning",
  description:
    "Review NovaSprout Learning AI tutor pricing, including a single 1-hour class and monthly AI-supported tutoring plans."
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
          <span>Single 1-hour AI-supported class available</span>
          <span>Monthly AI tutor plan for ongoing support</span>
          <span>AI tutor launch: generated lessons, live explanation, timed quiz</span>
          <span>Single 1-hour AI-supported class available</span>
          <span>Monthly AI tutor plan for ongoing support</span>
        </div>
      </section>

      <section className="landing-hero compact-hero">
        <div>
          <p className="eyebrow">Pricing</p>
          <h1>Choose one AI tutor plan: single class or monthly support.</h1>
          <p>
            NovaSprout combines live online tutoring with AI-generated lesson decks, practice
            questions, timed quizzes, and follow-up notes.
          </p>
        </div>
        <div className="landing-panel">
          <CheckCircle2 aria-hidden="true" size={42} />
          <h2>AI tutor launch</h2>
          <p>Start with a 1-hour class or choose monthly AI-supported tutoring for a recurring study rhythm.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Options</p>
          <h2>Two simple AI tutor options.</h2>
          <p>
            Use Stripe checkout for the class or monthly plan. For questions before purchase,
            contact NovaSprout from the footer or booking section.
          </p>
        </div>
        <PricingOptions />
      </section>

      <Footer />
    </main>
  );
}
