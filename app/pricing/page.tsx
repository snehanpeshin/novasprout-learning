import { CheckCircle2 } from "lucide-react";
import Footer from "../components/Footer";
import PricingOptions from "../components/PricingOptions";

export const metadata = {
  title: "Tutoring Pricing | NovaSprout Learning",
  description: "Start with a free NovaSprout Learning demo class, then choose a protected single session or a custom monthly tutoring plan."
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
          <a href="/#book">Book demo</a>
        </nav>
      </header>

      <section className="demo-strip" aria-label="Free demo class announcement">
        <div className="demo-track">
          <span>First demo class free</span>
          <span>First paid session fit guarantee</span>
          <span>Custom monthly plan after fit is confirmed</span>
          <span>First demo class free</span>
          <span>First paid session fit guarantee</span>
          <span>Custom monthly plan after fit is confirmed</span>
        </div>
      </section>

      <section className="landing-hero compact-hero">
        <div>
          <p className="eyebrow">Pricing</p>
          <h1>Start with a free demo class, then continue only if it feels right.</h1>
          <p>
            After the demo, try one protected paid session or choose a custom monthly plan for
            steady online support.
          </p>
        </div>
        <div className="landing-panel">
          <CheckCircle2 aria-hidden="true" size={42} />
          <h2>Low-pressure start</h2>
          <p>Book, meet online, receive notes, and use the first-session fit guarantee if it is not a match.</p>
        </div>
      </section>

      <section className="section">
        <PricingOptions />
      </section>

      <Footer />
    </main>
  );
}
