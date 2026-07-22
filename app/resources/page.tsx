import type { Metadata } from "next";
import { ArrowRight, BookOpenCheck, Lightbulb } from "lucide-react";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";
import { subjectTracks } from "../site-data";

export const metadata: Metadata = {
  title: "Student Learning Resources | NovaSprout Learning",
  description: "Choose a tutoring subject or use NovaSprout's optional AI study tool for a personalized visual lesson.",
  alternates: { canonical: "/resources" }
};

export default function ResourcesPage() {
  return (
    <main className="ns-site ns-simple-page">
      <SiteHeader />
      <section className="ns-page-hero ns-page-hero-compact"><p className="ns-eyebrow">Learning resources</p><h1>Start with the subject and the question.</h1><p>Explore what live tutoring can cover, or create a self-guided visual lesson in the separate AI study tool.</p></section>
      <section className="ns-section ns-resource-paths">
        {subjectTracks.map((subject) => <article key={subject.slug}><subject.icon /><div><h2>{subject.navTitle}</h2><p>{subject.summary}</p><a href={`/${subject.slug}`}>Explore subject support <ArrowRight /></a></div></article>)}
      </section>
      <section className="ns-ai-note"><div><p className="ns-eyebrow">Optional self-guided support</p><h2>Create a personalized AI lesson.</h2><p>Choose a curriculum-appropriate grade, subject, and topic, then study with a visual lesson and quiz.</p></div><a className="ns-button ns-button-secondary" href="/ai-lesson-generator"><Lightbulb />Open AI Study Tool</a></section>
      <section className="ns-application-cta"><div><p className="ns-eyebrow">Prefer human guidance?</p><h2>Request a live tutor.</h2><p>Begin with a Free Demo Class and decide whether the match feels right.</p></div><a className="ns-button ns-button-primary" href="/contact#free-demo"><BookOpenCheck />Book a Free Demo</a></section>
      <Footer />
    </main>
  );
}
