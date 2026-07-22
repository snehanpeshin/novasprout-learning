import { Mail, Phone } from "lucide-react";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";
import { contactEmail, contactPhone, contactPhoneHref } from "../site-data";

export const metadata = {
  title: "Privacy Policy | NovaSprout Learning",
  description:
    "Privacy policy for NovaSprout Learning, a brand of Karigari Home LLC.",
  alternates: { canonical: "/privacy" }
};

export default function PrivacyPolicy() {
  return (
    <main className="policy-page ns-site ns-policy-page">
      <SiteHeader />
      <section className="policy-hero">
        <p className="ns-eyebrow">Privacy Policy</p>
        <h1>How we protect student and parent information.</h1>
        <p>
          Effective date: July 20, 2026. NovaSprout Learning is a brand of Karigari
          Home LLC. This Privacy Policy explains how NovaSprout Learning collects, uses,
          and protects information when families use our website, forms, booking links,
          mobile app, AI learning tools, online tutoring resources, and related services.
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
          <p>
            When a user creates an AI lesson, we process the selected grade, subject, topic,
            learning goal, and any optional question the user enters. Users should not enter
            sensitive personal information in an AI lesson request.
          </p>
        </article>

        <article>
          <h2>How We Use Information</h2>
          <p>We use information to:</p>
          <ul>
            <li>Respond to inquiries and schedule consultations.</li>
            <li>Understand student goals and recommend tutoring support.</li>
            <li>Provide online tutoring, notes, resources, and follow-up communication.</li>
            <li>Generate requested AI lessons, educational visuals, quizzes, and lesson PDFs.</li>
            <li>Improve our website, services, and educational materials.</li>
            <li>Send service-related messages, reminders, and updates.</li>
            <li>Measure advertising performance and website activity.</li>
          </ul>
        </article>

        <article>
          <h2>NovaSprout Mobile App</h2>
          <p>
            The NovaSprout mobile app stores downloaded lesson PDFs, lesson history, and quiz
            scores locally on the user's device. A beta access code is stored in the device's
            secure keychain. Users can remove saved lessons from the app settings, and removing
            the app removes this locally stored app data.
          </p>
          <p>
            Lesson requests are sent securely to NovaSprout servers and AI service providers to
            create the requested educational content. The mobile app does not contain our AI
            provider credentials, does not display advertising, and does not use third-party
            advertising trackers.
          </p>
          <p>
            AI lesson purchases and subscriptions are processed by Apple through StoreKit. We
            receive an Apple-signed transaction identifier, product identifier, purchase status,
            and subscription expiration information to confirm access, prevent reuse of a
            single-lesson purchase, and apply monthly lesson limits. We do not receive the user's
            full payment-card details from Apple.
          </p>
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
            may include AWS Amplify for hosting, Supabase for secure request and service records,
            Calendly for booking, Google Forms or similar
            tools for intake forms, Gmail or Google Workspace for email, Google Meet or Zoom
            for online sessions, YouTube for video resources, OpenAI for AI-assisted educational
            content and images, and Google Ads or Google tags for website advertising and
            measurement.
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
            Optional Google Ads and analytics storage is denied by default. If you select
            "Accept cookies," Google may use cookies or similar technologies to measure website
            activity and advertising performance. If you decline, those optional storage signals
            remain denied. Your choice is saved in your browser and can be changed through the
            Cookie settings button.
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
            For privacy questions or requests, contact NovaSprout Learning, a brand of
            Karigari Home LLC, at:
          </p>
          <a className="policy-email" href={`mailto:${contactEmail}`}>
            <Mail aria-hidden="true" size={18} />
            {contactEmail}
          </a>
          <a className="policy-email" href={contactPhoneHref}>
            <Phone aria-hidden="true" size={18} />
            {contactPhone}
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

      <Footer />
    </main>
  );
}
