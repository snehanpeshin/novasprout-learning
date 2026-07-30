import { Mail } from "lucide-react";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";
import { contactEmail } from "../site-data";

export const metadata = {
  title: "Terms of Use | NovaSprout Learning",
  description:
    "Terms for NovaSprout Learning tutoring, educational resources, and AI study tools.",
  alternates: { canonical: "/terms" }
};

export default function TermsOfUse() {
  return (
    <main className="policy-page ns-site ns-policy-page">
      <SiteHeader />
      <section className="policy-hero">
        <p className="ns-eyebrow">Terms of Use</p>
        <h1>Clear expectations for tutoring and learning tools.</h1>
        <p>
          Effective date: July 28, 2026. These terms apply to NovaSprout Learning, a
          brand of Karigari Home LLC, including its website, tutoring services,
          educational resources, mobile app, and AI-assisted learning tools.
        </p>
      </section>

      <section className="policy-content">
        <article>
          <h2>Educational Purpose</h2>
          <p>
            NovaSprout provides educational support and study tools. It does not guarantee a
            particular grade, test score, admission decision, or academic result. Students and
            families remain responsible for reviewing work, following school rules, and deciding
            how to use generated or tutor-provided material.
          </p>
        </article>

        <article>
          <h2>Accounts, Purchases, and Bookings</h2>
          <p>
            You must provide accurate contact and payment information and use the service only for
            lawful educational purposes. Tutoring bookings, cancellations, subscriptions, and
            single-lesson purchases are also subject to the terms shown at checkout and the
            NovaSprout Refund Policy. App-store transactions may be governed by the store&apos;s
            own terms.
          </p>
        </article>

        <article>
          <h2>User Materials</h2>
          <p>
            You retain ownership of homework, prompts, documents, and other material you submit.
            You give Karigari Home LLC a limited permission to process that material only as needed
            to provide, secure, and improve the requested service. Do not submit confidential
            records, another person&apos;s copyrighted work without permission, or sensitive
            personal information that is not necessary for the learning request.
          </p>
        </article>

        <article>
          <h2>NovaSprout Content</h2>
          <p>
            The NovaSprout name, logo, website design, original lessons, and original marketing
            materials are owned by Karigari Home LLC or used with permission. Personal,
            non-commercial study use is allowed. Republishing, selling, scraping, or presenting
            NovaSprout content as another provider&apos;s work requires written permission.
          </p>
        </article>

        <article>
          <h2>AI-Assisted Material</h2>
          <p>
            AI-generated lessons, explanations, quizzes, and images can contain mistakes or
            similarities to other material. Review outputs before relying on or publishing them,
            verify important facts, and do not use the service to imitate a living artist, evade
            academic-integrity rules, or reproduce protected material.
          </p>
        </article>

        <article>
          <h2>Third-Party Services and Marks</h2>
          <p>
            References to Apple, Google, Zoom, Calendly, YouTube, OpenAI, curriculum frameworks,
            or other third-party services identify tools or resources used in a workflow. Their
            names and marks belong to their respective owners. Unless expressly stated in writing,
            those references do not imply sponsorship, endorsement, certification, or affiliation
            with NovaSprout Learning.
          </p>
        </article>

        <article>
          <h2>Acceptable Use</h2>
          <p>
            Do not misuse the service, interfere with its security, attempt unauthorized access,
            submit unlawful or harmful content, infringe another person&apos;s rights, or use
            automated systems to extract content or overload the service. Access may be limited or
            suspended when reasonably necessary to protect users, the service, or legal rights.
          </p>
        </article>

        <article>
          <h2>Availability and Changes</h2>
          <p>
            Features, tutors, schedules, prices, and third-party services may change. Services are
            provided on an as-available basis to the extent permitted by law. Nothing in these
            terms limits rights that cannot legally be limited.
          </p>
        </article>

        <article>
          <h2>Contact</h2>
          <p>Questions about these terms or content rights can be sent to:</p>
          <a className="policy-email" href={`mailto:${contactEmail}`}>
            <Mail aria-hidden="true" size={18} />
            {contactEmail}
          </a>
        </article>
      </section>
      <Footer />
    </main>
  );
}
