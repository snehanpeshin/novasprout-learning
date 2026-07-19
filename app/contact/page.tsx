import { CalendarCheck } from "lucide-react";
import ContactForm from "../components/ContactForm";
import Footer from "../components/Footer";
import TrackedLink from "../components/TrackedLink";
import { bookingUrl } from "../site-data";

export const metadata = {
  title: "Contact NovaSprout Learning",
  description: "Contact NovaSprout Learning about AI lessons, live online tutoring, pricing, or tutor applications."
};

export default function ContactPage() {
  return (
    <main className="landing-page">
      <header className="site-header">
        <a className="brand" href="/" aria-label="NovaSprout Learning home">
          <img className="brand-logo" src="/novasprout-logo.png" alt="" />
          <span>NovaSprout Learning</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="/#subjects">Subjects</a>
          <a href="/ai-lesson-generator">AI Tutor</a>
          <a href="/find-a-tutor">Live Tutoring</a>
          <a href="/pricing">Pricing</a>
        </nav>
      </header>

      <section className="contact-page-section">
        <div className="contact-page-copy">
          <p className="eyebrow">Contact</p>
          <h1>Tell us how NovaSprout can help.</h1>
          <p>
            Ask about AI Tutor access, one-to-one live tutoring, subjects, scheduling, or becoming
            a tutor. We will reply using the contact details you provide.
          </p>
          <TrackedLink className="button secondary" eventName="book_meeting_click" href={bookingUrl} target="_blank">
            <CalendarCheck aria-hidden="true" size={18} />
            Book Free Live Demo
          </TrackedLink>
        </div>
        <ContactForm />
      </section>

      <Footer />
    </main>
  );
}
