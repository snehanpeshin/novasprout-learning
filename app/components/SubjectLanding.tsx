import { ArrowRight, Check, CheckCircle2 } from "lucide-react";
import ContactForm from "./ContactForm";
import Footer from "./Footer";
import SiteHeader from "./SiteHeader";
import { subjectTracks } from "../site-data";

type SubjectLandingProps = { slug: string };

export default function SubjectLanding({ slug }: SubjectLandingProps) {
  const subject = subjectTracks.find((track) => track.slug === slug);
  if (!subject) return null;

  return (
    <main className="ns-site ns-subject-page">
      <SiteHeader />
      <section className={`ns-subject-hero ns-accent-${subject.accent}`}>
        <div>
          <p className="ns-eyebrow">{subject.level}</p>
          <h1>{subject.hero}</h1>
          <p>{subject.copy}</p>
          <div className="ns-actions">
            <a className="ns-button ns-button-primary" href="#free-demo">Book a Free Demo <ArrowRight aria-hidden="true" /></a>
            <a className="ns-button ns-button-secondary" href="#topics">See Topics</a>
          </div>
        </div>
        <aside>
          <span className="ns-subject-icon"><subject.icon aria-hidden="true" /></span>
          <p className="ns-card-kicker">{subject.title}</p>
          <h2>{subject.summary}</h2>
          <ul>
            <li><CheckCircle2 aria-hidden="true" />Live one-to-one support</li>
            <li><CheckCircle2 aria-hidden="true" />Matched to level and goals</li>
            <li><CheckCircle2 aria-hidden="true" />Free Demo Class</li>
          </ul>
        </aside>
      </section>

      <section className="ns-section ns-subject-challenges">
        <div className="ns-section-heading"><p className="ns-eyebrow">Common challenges</p><h2>When this tutoring can help.</h2></div>
        <div className="ns-three-grid">
          {subject.challenges.map((challenge, index) => <article key={challenge}><span>0{index + 1}</span><p>{challenge}</p></article>)}
        </div>
      </section>

      <section className="ns-section ns-topic-section" id="topics">
        <div><p className="ns-eyebrow">Topics covered</p><h2>Focused help based on the current need.</h2><p>Exact coverage depends on the requested level and available tutor expertise.</p></div>
        <ul className="ns-topic-list">{subject.topics.map((topic) => <li key={topic}><subject.icon aria-hidden="true" />{topic}</li>)}</ul>
      </section>

      <section className="ns-section ns-session-layout">
        <div>
          <p className="ns-eyebrow">What sessions look like</p>
          <h2>Clear explanation, active practice, useful next steps.</h2>
          <ol>{subject.session.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol>
        </div>
        <aside>
          <h3>Realistic benefits</h3>
          {subject.benefits.map((benefit) => <p key={benefit}><Check aria-hidden="true" />{benefit}</p>)}
          <small>Progress varies by student, attendance, practice, and current learning needs.</small>
        </aside>
      </section>

      <section className="ns-match-band">
        <div><p className="ns-eyebrow">Curated matching</p><h2>Tell us the need. We review the fit.</h2></div>
        <p>NovaSprout considers subject expertise, level, goals, communication style, availability, and time zone before recommending an available tutor.</p>
      </section>

      <section className="ns-section ns-faq">
        <div className="ns-section-heading"><p className="ns-eyebrow">Subject questions</p><h2>Before the first meeting.</h2></div>
        <div className="ns-faq-list">{subject.faq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      </section>

      <section className="ns-demo-section" id="free-demo">
        <div className="ns-demo-copy"><p className="ns-eyebrow">Free Demo Class</p><h2>Let’s understand what support would help.</h2><p>Share the current level, goals, and schedule. For students under 18, a parent or guardian should complete the request.</p></div>
        <ContactForm />
      </section>
      <Footer />
    </main>
  );
}
