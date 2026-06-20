import { CheckCircle2 } from "lucide-react";
import PricingOptions from "../components/PricingOptions";

export const metadata = {
  title: "Tutoring Pricing | NovaSprout Learning",
  description: "Start with a free NovaSprout Learning demo class, then choose single-session or monthly online tutoring support."
};

export default function PricingPage() {
  return (
    <main className="landing-page">
      <header className="site-header">
        <a className="brand" href="/" aria-label="NovaSprout Learning home">
          <span className="brand-mark">N</span>
          <span>NovaSprout Learning</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="/#subjects">Subjects</a>
          <a href="/#book">Book</a>
        </nav>
      </header>

      <section className="demo-strip" aria-label="Free demo class announcement">
        <div className="demo-track">
          <span>First demo class free</span>
          <span>Choose one tutoring session or a monthly plan</span>
          <span>No account required</span>
          <span>First demo class free</span>
          <span>Choose one tutoring session or a monthly plan</span>
          <span>No account required</span>
        </div>
      </section>

      <section className="landing-hero compact-hero">
        <div>
          <p className="eyebrow">Pricing</p>
          <h1>Start with a free demo class, then choose a simple tutoring plan.</h1>
          <p>
            After the demo, pick a single session for focused help or a monthly package for steady
            online support.
          </p>
        </div>
        <div className="landing-panel">
          <CheckCircle2 aria-hidden="true" size={42} />
          <h2>No account required</h2>
          <p>Book, meet online, receive notes, and decide the next step without a complicated platform.</p>
        </div>
      </section>

      <section className="section">
        <PricingOptions />
      </section>
    </main>
  );
}
