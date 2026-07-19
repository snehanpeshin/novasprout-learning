import { ArrowRight, CheckCircle2 } from "lucide-react";
import TrackedLink from "./TrackedLink";
import { bookingUrl, pricingPlans } from "../site-data";

export default function PricingOptions() {
  const groups = [
    {
      copy: "Self-guided, personalized lessons generated around the student's grade, topic, and learning goal.",
      id: "ai-tutor-plans",
      service: "ai" as const,
      title: "AI Tutor"
    },
    {
      copy: "Direct one-to-one online sessions with a human tutor. AI Tutor access is not required.",
      id: "live-tutoring-plans",
      service: "live" as const,
      title: "Live Tutoring"
    }
  ];

  return (
    <div className="pricing-plan-groups">
      {groups.map((group) => (
        <div className="pricing-plan-group" id={group.id} key={group.service}>
          <div className="pricing-group-heading">
            <h2>{group.title}</h2>
            <p>{group.copy}</p>
          </div>
          <div className="pricing-grid">
            {pricingPlans.filter((plan) => plan.service === group.service).map((plan) => (
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
                <div className="payment-actions">
                  {plan.action === "ai" ? (
                    <a className="button primary full" href="/ai-lesson-generator">
                      Start Free AI Tutor
                      <ArrowRight aria-hidden="true" size={18} />
                    </a>
                  ) : null}
                  {plan.action === "booking" ? (
                    <TrackedLink className="button primary full" eventName="book_meeting_click" href={bookingUrl} target="_blank">
                      Book Free Live Demo
                      <ArrowRight aria-hidden="true" size={18} />
                    </TrackedLink>
                  ) : null}
                  {plan.action === "contact" ? (
                    <a className="button primary full" href="/contact">
                      Contact to Start
                      <ArrowRight aria-hidden="true" size={18} />
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
