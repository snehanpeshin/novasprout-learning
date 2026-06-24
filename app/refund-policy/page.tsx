import { Mail } from "lucide-react";

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "novasproutlearning@gmail.com";

export const metadata = {
  title: "Refund Policy | NovaSprout Learning",
  description:
    "Refund and cancellation policy for NovaSprout Learning online tutoring services."
};

export default function RefundPolicy() {
  return (
    <main className="policy-page">
      <section className="policy-hero">
        <a className="brand policy-brand" href="/" aria-label="NovaSprout Learning home">
          <img className="brand-logo" src="/novasprout-logo.png" alt="" />
          <span>NovaSprout Learning</span>
        </a>
        <p className="eyebrow">Refund Policy</p>
        <h1>Simple refund rules for tutoring sessions and packages.</h1>
        <p>
          Effective date: June 20, 2026. NovaSprout Learning is a brand of Karigari
          Home LLC. This policy explains how refunds, cancellations, and rescheduling
          work for our online tutoring services.
        </p>
      </section>

      <section className="policy-content">
        <article>
          <h2>Free Demo Class</h2>
          <p>
            The first demo class is free. There is no payment required for the demo,
            so there is no refund needed if you decide not to continue afterward.
          </p>
        </article>

        <article>
          <h2>Single Tutoring Sessions</h2>
          <p>
            Paid single tutoring sessions are refundable if cancelled at least 24 hours
            before the scheduled session time. Sessions cancelled with less than 24 hours
            notice, or missed without notice, are generally non-refundable.
          </p>
          <p>
            We may allow one reschedule for a late cancellation when there is a reasonable
            conflict or emergency.
          </p>
        </article>

        <article>
          <h2>Monthly Tutoring Packages</h2>
          <p>
            Completed tutoring sessions are not refundable. If you cancel a monthly package,
            we may refund the unused future sessions in that package after subtracting any
            completed sessions, payment processing costs, or discounts already applied.
          </p>
        </article>

        <article>
          <h2>Technical Issues</h2>
          <p>
            If a session cannot happen because of a technical issue on our side, we will
            offer a rescheduled session or a refund for that session. If a student has a
            local internet, device, or login issue, we will first try to reschedule when
            reasonable.
          </p>
        </article>

        <article>
          <h2>How to Request a Refund</h2>
          <p>
            To request a refund or reschedule, contact us with the student's name, session
            date, payment email, and a short explanation. Refunds are reviewed case by case
            and, when approved, are returned to the original payment method.
          </p>
          <a className="policy-email" href={`mailto:${contactEmail}`}>
            <Mail aria-hidden="true" size={18} />
            {contactEmail}
          </a>
        </article>

        <article>
          <h2>Policy Updates</h2>
          <p>
            We may update this Refund Policy from time to time. When we do, we will update
            the effective date on this page.
          </p>
        </article>
      </section>
    </main>
  );
}
