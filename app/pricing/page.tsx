import { ArrowRight, CheckCircle2 } from "lucide-react";
import CheckoutButton from "../components/CheckoutButton";
import TrackedLink from "../components/TrackedLink";
import { bookingUrl, intakeForm, pricingPlans } from "../site-data";

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
        <div className="pricing-grid">
          {pricingPlans.map((plan) => (
            <article className="price-card" key={plan.title}>
              <h3>{plan.title}</h3>
              <strong>{plan.price}</strong>
              <p>{plan.copy}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <CheckCircle2 aria-hidden="true" size={17} />
                    {feature}
                  </li>
                ))}
              </ul>
              {plan.productKey ? (
                <div className="payment-actions">
                  <CheckoutButton className="button primary full" productKey={plan.productKey}>
                    Pay with Stripe Checkout
                  </CheckoutButton>
                  {plan.paymentLink ? (
                    <a className="button secondary full" href={plan.paymentLink} rel="noreferrer" target="_blank">
                      Use Stripe Payment Link
                    </a>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="booking-section">
        <div className="booking-copy">
          <p className="eyebrow">Book</p>
          <h2>Talk through the best option first.</h2>
        </div>
        <div className="booking-actions">
          <TrackedLink className="button primary full" eventName="book_meeting_click" href={bookingUrl} target="_blank">
            Book a free consultation
            <ArrowRight aria-hidden="true" size={18} />
          </TrackedLink>
          <TrackedLink className="button secondary full" eventName="intake_form_click" href={intakeForm} target="_blank">
            Complete intake form
          </TrackedLink>
        </div>
      </section>
    </main>
  );
}
