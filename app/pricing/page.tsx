import { CheckCircle2 } from "lucide-react";
import PricingOptions from "../components/PricingOptions";

export const metadata = {
  title: "Tutoring Pricing | NovaSprout Learning",
  description: "Start with a free NovaSprout Learning intro call, then choose single-session or starter-pack online tutoring support."
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
          <a href="/resources">Resources</a>
          <a href="/#book">Book</a>
        </nav>
      </header>

      <section className="landing-hero compact-hero">
        <div>
          <p className="eyebrow">Pricing</p>
          <h1>Start small, then choose the tutoring rhythm that fits.</h1>
          <p>
            The first step is a free intro call. After that, we recommend a session or package
            based on the student's goals, schedule, and subject needs.
          </p>
        </div>
        <div className="landing-panel">
          <CheckCircle2 aria-hidden="true" size={42} />
          <h2>No account required</h2>
          <p>Keep the first version simple: book, meet online, receive notes, and decide the next step.</p>
        </div>
      </section>

      <section className="section">
        <PricingOptions />
      </section>
    </main>
  );
}
