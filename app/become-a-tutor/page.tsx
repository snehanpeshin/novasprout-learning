import type { Metadata } from "next";
import { ArrowRight, Check, ClipboardCheck, Mail, SearchCheck, Users } from "lucide-react";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";
import { contactEmail } from "../site-data";

export const metadata: Metadata = {
  title: "Become an Online Tutor | NovaSprout Learning",
  description: "Apply to join NovaSprout Learning's reviewed tutor network for math, science, coding, data skills, or study-skills support.",
  alternates: { canonical: "/become-a-tutor" }
};

const applicationBody = `Name:\nEmail:\nSubjects and levels:\nAvailability and time zone:\nRelevant experience or qualifications:\nTeaching approach:\nResume, LinkedIn, or profile link:\n`;

export default function BecomeATutorPage() {
  const applicationHref = `mailto:${contactEmail}?subject=${encodeURIComponent("NovaSprout tutor application")}&body=${encodeURIComponent(applicationBody)}`;
  return (
    <main className="ns-site ns-simple-page">
      <SiteHeader />
      <section className="ns-page-hero">
        <p className="ns-eyebrow">Tutor applications</p>
        <h1>Help students understand the next step, not just the answer.</h1>
        <p>NovaSprout reviews tutors for subject fit, communication, availability, and a patient approach to online learning.</p>
        <a className="ns-button ns-button-primary" href={applicationHref}>Apply by Email <Mail aria-hidden="true" /></a>
      </section>
      <section className="ns-section ns-tutor-recruiting">
        <div><p className="ns-eyebrow">Current subject areas</p><h2>Where we review applications.</h2></div>
        <ul><li><Check />Math</li><li><Check />Science & STEM</li><li><Check />Coding & data skills</li><li><Check />Study skills</li></ul>
      </section>
      <section className="ns-section ns-process">
        <div className="ns-section-heading"><p className="ns-eyebrow">Application process</p><h2>A reviewed, match-based network.</h2></div>
        <ol className="ns-steps">
          <li><span><ClipboardCheck /></span><div><h3>Share your background</h3><p>Include subjects, levels, experience, qualifications, availability, time zone, and a resume or profile link.</p></div></li>
          <li><span><SearchCheck /></span><div><h3>NovaSprout reviews fit</h3><p>We consider subject knowledge, communication, reliability, and approach to student support.</p></div></li>
          <li><span><Users /></span><div><h3>Hear from us when a request aligns</h3><p>Approved tutors may be contacted when a student’s subject, level, needs, and schedule match. Work is not guaranteed.</p></div></li>
        </ol>
      </section>
      <section className="ns-application-cta"><div><p className="ns-eyebrow">Ready to apply?</p><h2>Send a complete introduction.</h2><p>Please do not send sensitive identity documents in the first email. We will explain any later verification steps directly.</p></div><a className="ns-button ns-button-primary" href={applicationHref}>Prepare Application <ArrowRight /></a></section>
      <Footer />
    </main>
  );
}
