import { Mail } from "lucide-react";

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@novasproutlearning.com";

export const metadata = {
  title: "Privacy Policy | NovaSprout Learning",
  description:
    "Privacy policy for NovaSprout Learning online tutoring, intake forms, booking, resources, and advertising."
};

export default function PrivacyPolicy() {
  return (
    <main className="policy-page">
      <section className="policy-hero">
        <a className="brand policy-brand" href="/" aria-label="NovaSprout Learning home">
          <span className="brand-mark">N</span>
          <span>NovaSprout Learning</span>
        </a>
        <p className="eyebrow">Privacy Policy</p>
        <h1>How we protect student and parent information.</h1>
        <p>
          Effective date: June 14, 2026. This Privacy Policy explains how NovaSprout
          Learning collects, uses, and protects information when families use our website,
          forms, booking links, online tutoring resources, and related services.
        </p>
      </section>

      <section className="policy-content">
        <article>
          <h2>Information We Collect</h2>
          <p>
            We may collect information that a parent, guardian, student, or prospective
            customer chooses to share with us, including names, email addresses, phone
            numbers, student grade level, subject interests, learning goals, scheduling
            preferences, messages, and information submitted through intake forms or lead
            forms.
          </p>
          <p>
            During tutoring, we may also create or receive session notes, homework details,
            learning observations, shared documents, or other educational materials needed
            to support the student.
          </p>
        </article>

        <article>
          <h2>How We Use Information</h2>
          <p>We use information to:</p>
          <ul>
            <li>Respond to inquiries and schedule consultations.</li>
            <li>Understand student goals and recommend tutoring support.</li>
            <li>Provide online tutoring, notes, resources, and follow-up communication.</li>
            <li>Improve our website, services, and educational materials.</li>
            <li>Send service-related messages, reminders, and updates.</li>
            <li>Measure advertising performance and website activity.</li>
          </ul>
        </article>

        <article>
          <h2>Students and Children</h2>
          <p>
            NovaSprout Learning is designed to support students, including younger learners,
            but we expect parents or guardians to initiate contact, complete forms, make
            bookings, and provide consent for tutoring services when required. We do not
            knowingly ask children to submit personal information without parent or guardian
            involvement.
          </p>
          <p>
            Parents or guardians may contact us to review, update, or request deletion of a
            student's personal information.
          </p>
        </article>

        <article>
          <h2>Third-Party Services</h2>
          <p>
            We use trusted third-party services to run the website and provide tutoring. These
            may include AWS Amplify for hosting, Calendly for booking, Google Forms or similar
            tools for intake forms, Gmail or Google Workspace for email, Google Meet or Zoom
            for online sessions, YouTube for video resources, and Google Ads or Google tags
            for advertising and measurement.
          </p>
          <p>
            These services may process information according to their own privacy policies and
            settings. We only use them to operate NovaSprout Learning and communicate with
            students and parents.
          </p>
        </article>

        <article>
          <h2>Cookies and Advertising</h2>
          <p>
            Our website may use cookies, pixels, or similar technologies from services such as
            Google Ads to understand website visits, measure ad performance, and improve our
            outreach. You can control cookies through your browser settings and may also use
            Google advertising controls where available.
          </p>
        </article>

        <article>
          <h2>How We Share Information</h2>
          <p>
            We do not sell student or parent personal information. We may share information
            only with service providers that help us operate tutoring, booking, communication,
            hosting, forms, analytics, or advertising, or when required by law or necessary to
            protect safety, security, or legal rights.
          </p>
        </article>

        <article>
          <h2>Data Security and Retention</h2>
          <p>
            We use reasonable administrative and technical safeguards to protect information.
            No internet service can guarantee absolute security, but we aim to limit access to
            information to people and tools that need it to provide tutoring services.
          </p>
          <p>
            We keep information for as long as needed to provide services, respond to inquiries,
            maintain records, improve our offerings, or meet legal and operational needs.
          </p>
        </article>

        <article>
          <h2>Your Choices</h2>
          <p>
            You may contact us to request access, correction, or deletion of personal
            information, or to ask us to stop contacting you for non-essential communications.
            Some information may need to be retained for legitimate business, legal, safety, or
            recordkeeping reasons.
          </p>
        </article>

        <article>
          <h2>Contact Us</h2>
          <p>
            For privacy questions or requests, contact NovaSprout Learning at:
          </p>
          <a className="policy-email" href={`mailto:${contactEmail}`}>
            <Mail aria-hidden="true" size={18} />
            {contactEmail}
          </a>
        </article>

        <article>
          <h2>Policy Updates</h2>
          <p>
            We may update this Privacy Policy from time to time. When we do, we will update the
            effective date on this page.
          </p>
        </article>
      </section>
    </main>
  );
}
