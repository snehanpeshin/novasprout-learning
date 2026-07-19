import { CheckCircle2 } from "lucide-react";
import Footer from "../components/Footer";
import PricingOptions from "../components/PricingOptions";

export const metadata = {
  title: "AI Tutor and Live Tutoring Plans | NovaSprout Learning",
  description:
    "Compare NovaSprout Learning AI Tutor access and separate one-to-one live tutoring options."
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
          <a href="/find-a-tutor">Live Tutoring</a>
          <a href="/contact">Contact</a>
        </nav>
      </header>

      <section className="demo-strip" aria-label="Tutoring options announcement">
        <div className="demo-track">
          <span>First live tutoring demo is free</span>
          <span>AI Tutor and Live Tutoring are separate services</span>
          <span>Choose self-guided AI lessons or one-to-one human tutoring</span>
          <span>First live tutoring demo is free</span>
          <span>AI Tutor and Live Tutoring are separate services</span>
          <span>Choose self-guided AI lessons or one-to-one human tutoring</span>
        </div>
      </section>

      <section className="landing-hero compact-hero">
        <div>
          <p className="eyebrow">Pricing</p>
          <h1>Choose AI Tutor or Live Tutoring.</h1>
          <p>
            Use personalized AI lessons independently, or book direct one-to-one sessions with a
            human tutor. You can choose either service without purchasing the other.
          </p>
        </div>
        <div className="landing-panel">
          <CheckCircle2 aria-hidden="true" size={42} />
          <h2>Two clear services</h2>
          <p>AI Tutor supports self-guided study. Live Tutoring provides scheduled human instruction.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Options</p>
          <h2>Pick the learning format that fits.</h2>
          <p>
            AI Tutor plans and Live Tutoring plans are listed separately below. Start with a free AI
            lesson or book a free live tutoring demo.
          </p>
        </div>
        <PricingOptions />
      </section>

      <Footer />
    </main>
  );
}
