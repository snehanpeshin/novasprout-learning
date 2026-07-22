import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import ContactForm from "../components/ContactForm";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";
import { contactEmail, contactPhone, contactPhoneHref } from "../site-data";

export const metadata: Metadata = {
  title: "Book a Free Demo Class | NovaSprout Learning",
  description: "Tell NovaSprout what tutoring support the student needs and request a free online demo class.",
  alternates: { canonical: "/contact" }
};

export default function ContactPage() {
  return (
    <main className="ns-site ns-simple-page">
      <SiteHeader />
      <section className="ns-page-hero ns-page-hero-compact">
        <p className="ns-eyebrow">Free Demo Class</p>
        <h1>Tell us what would help the student learn more comfortably.</h1>
        <p>We review the request before suggesting an available tutor and next step. No payment or commitment is required.</p>
      </section>
      <section className="ns-demo-section ns-contact-page" id="free-demo">
        <div className="ns-demo-copy">
          <h2>What to share</h2>
          <p>The subject, current level, main challenge, goals, availability, and time zone are enough to begin.</p>
          <p>For students under 18, a parent or guardian should complete the form and participate in the initial arrangements.</p>
          <div className="ns-direct-contact">
            <a href={`mailto:${contactEmail}`}><Mail aria-hidden="true" /><span><strong>Email</strong>{contactEmail}</span></a>
            <a href={contactPhoneHref}><Phone aria-hidden="true" /><span><strong>Phone</strong>{contactPhone}</span></a>
          </div>
        </div>
        <ContactForm />
      </section>
      <Footer />
    </main>
  );
}
