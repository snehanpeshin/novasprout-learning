import { ArrowRight, CheckCircle2 } from "lucide-react";
import TrackedLink from "./TrackedLink";
import { contactEmail, pricingPlans } from "../site-data";

export default function PricingOptions() {
  return (
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
          {plan.title === "Free AI Tutor" ? (
            <div className="payment-actions">
              <a className="button primary full" href="/ai-lesson-generator">
                Start Free AI Tutor
                <ArrowRight aria-hidden="true" size={18} />
              </a>
            </div>
          ) : null}
          {plan.productKey && plan.paymentLink ? (
            <div className="payment-actions">
              <TrackedLink
                className="button primary full"
                eventName="stripe_payment_link_click"
                href={plan.paymentLink}
                target="_blank"
              >
                Request Live Tutor
                <ArrowRight aria-hidden="true" size={18} />
              </TrackedLink>
              <p className="payment-note">Secure Stripe checkout for optional live tutoring support.</p>
            </div>
          ) : null}
          {plan.productKey && !plan.paymentLink ? (
            <div className="payment-actions">
              <a className="button primary full" href={`mailto:${contactEmail}?subject=${encodeURIComponent(plan.title)}`}>
                Contact to Start
                <ArrowRight aria-hidden="true" size={18} />
              </a>
            </div>
          ) : null}
          {plan.title.includes("Student") || plan.title === "Family AI Tutor" ? (
            <div className="payment-actions">
              <a className="button primary full" href="/ai-lesson-generator">
                Unlock AI Tutor
                <ArrowRight aria-hidden="true" size={18} />
              </a>
              <a className="button secondary full" href={`mailto:${contactEmail}?subject=${encodeURIComponent(`${plan.title} subscription request`)}`}>
                Request This Plan
              </a>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
