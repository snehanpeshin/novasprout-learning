import { ArrowRight, CheckCircle2 } from "lucide-react";
import TrackedLink from "./TrackedLink";
import { bookingUrl, pricingPlans } from "../site-data";

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
          {plan.title === "Free Demo Class" ? (
            <div className="payment-actions">
              <TrackedLink className="button primary full" eventName="book_meeting_click" href={bookingUrl} target="_blank">
                Book free demo class
                <ArrowRight aria-hidden="true" size={18} />
              </TrackedLink>
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
                Pay with Stripe
                <ArrowRight aria-hidden="true" size={18} />
              </TrackedLink>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
