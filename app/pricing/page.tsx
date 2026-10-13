import type { Metadata } from "next";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import ContactForm from "../components/ContactForm";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Online Tutoring Pricing | NovaSprout Learning",
  description: "Start with a Free Demo Class, then continue with one-to-one online tutoring for $20 per class and a first paid-session fit guarantee.",
  alternates: { canonical: "/pricing" }
};

export default function PricingPage() {
  return (
    <main className="ns-site ns-simple-page">
      <SiteHeader />
      <section className="ns-page-hero">
        <p className="ns-eyebrow">Clear tutoring pricing</p>
        <h1>Get the right support for the time you have.</h1>
        <p>Request a short-notice tutor match for a live class, or begin a personalized AI lesson immediately while you choose a matching-call time.</p>
        <div className="ns-actions"><a className="ns-button ns-button-primary" href="/portal">Find a tutor fast <ArrowRight aria-hidden="true" /></a><a className="ns-button ns-button-secondary" href="/ai-lesson-generator">Start an AI lesson</a></div>
      </section>

      <section className="ns-section ns-pricing-detail">
        <div className="ns-pricing-steps">
          <article><span>01</span><p className="ns-card-kicker">Start here</p><h2>Free Demo Class</h2><strong>$0</strong><ul><li><Check />Discuss the student’s needs</li><li><Check />Experience the teaching approach</li><li><Check />No paid commitment</li></ul></article>
          <article className="is-featured"><span>02</span><p className="ns-card-kicker">Continue when ready</p><h2>Live tutoring</h2><strong>$20 <small>per class</small></strong><ul><li><Check />One-to-one online teaching</li><li><Check />Guided practice and feedback</li><li><Check />Follow-up notes or next steps</li></ul></article>
          <article><span>03</span><p className="ns-card-kicker">As needed</p><h2>Ongoing schedule</h2><strong>$20 <small>per class</small></strong><ul><li><Check />Same flat per-class rate</li><li><Check />Schedule based on availability</li><li><Check />Continue only while useful</li></ul></article>
        </div>
      </section>

      <section className="ns-guarantee-band">
        <ShieldCheck aria-hidden="true" />
        <div><p className="ns-eyebrow">First paid-session fit guarantee</p><h2>A lower-risk first step.</h2><p>If the first paid tutoring session is not a good fit, contact us within 24 hours. We will offer a refund for that session or a replacement session.</p><a href="/refund-policy">Read the full Refund Policy <ArrowRight aria-hidden="true" /></a></div>
      </section>

      <section className="ns-section ns-pricing-notes">
        <div><h2>What the class fee covers</h2><p>Live explanation, representative examples, guided practice, and a practical next step. The exact session length and meeting schedule are confirmed before payment.</p></div>
        <div><h2>Need help before a live class?</h2><p>AI Tutor costs $2.99 for one lesson or $14.99/month for up to 20 lessons. It provides a personalized visual lesson, guided practice, quiz, and follow-up hints right away. It is a useful bridge while a tutor match is being reviewed.</p><a className="ns-text-link" href="/ai-lesson-generator">Open AI Study Tool <ArrowRight /></a></div>
      </section>

      <section className="ns-demo-section" id="free-demo">
        <div className="ns-demo-copy"><p className="ns-eyebrow">Free Demo Class</p><h2>Tell us what support would help.</h2><p>We’ll use the subject, level, goals, and schedule to review the request before the demo.</p></div>
        <ContactForm />
      </section>
      <Footer />
    </main>
  );
}
