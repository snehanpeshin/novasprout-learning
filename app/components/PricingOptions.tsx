import { ArrowRight, CheckCircle2 } from "lucide-react";
import TrackedLink from "./TrackedLink";
import { contactEmail, pricingPlans } from "../site-data";

export default function PricingOptions() {
  return (
    <div className="pricing-grid pricing-grid-two">
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
          {plan.productKey && plan.paymentLink ? (
            <div className="payment-actions">
              <TrackedLink
                className="button primary full"
                eventName="stripe_payment_link_click"
                href={plan.paymentLink}
                target="_blank"
              >
                {plan.productKey === "monthly_subscription" ? "Start Monthly Plan" : "Buy 1-Hour Class"}
                <ArrowRight aria-hidden="true" size={18} />
              </TrackedLink>
              <p className="payment-note">Secure checkout through Stripe for NovaSprout Learning.</p>
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
        </article>
      ))}
    </div>
  );
}
