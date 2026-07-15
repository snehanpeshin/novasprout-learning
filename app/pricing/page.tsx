import { CheckCircle2 } from "lucide-react";
import Footer from "../components/Footer";
import PricingOptions from "../components/PricingOptions";

export const metadata = {
  title: "Tutoring Pricing | NovaSprout Learning",
  description:
    "Review NovaSprout Learning tutoring prices, including a free demo, individual online tutoring, and custom monthly plans."
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
          <a href="/#book">Book a Free Demo</a>
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
          <h1>Start with a free demo, then confirm the right rate and plan.</h1>
          <p>
            After the demo, NovaSprout confirms the tutor, subject level, schedule, and rate before
            payment. Individual tutoring is currently listed at $40-$60 per hour.
          </p>
        </div>
        <div className="landing-panel">
          <CheckCircle2 aria-hidden="true" size={42} />
          <h2>Payment after confirmation</h2>
          <p>Use payment links after the tutor, rate, and schedule are confirmed. See the refund policy for the first-session fit guarantee.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Options</p>
          <h2>Three ways to start or continue.</h2>
          <p>
            Cancellation, rescheduling, monthly minimums, and unused-session rules should be confirmed
            before a recurring plan because final operating terms are still being defined.
          </p>
        </div>
        <PricingOptions />
      </section>

      <Footer />
    </main>
  );
}
