import { ArrowRight, Bot, CalendarCheck, CheckCircle2, ClipboardList, Layers3 } from "lucide-react";
import Footer from "../components/Footer";
import TrackedLink from "../components/TrackedLink";
import {
  aiTutoringWorkflow,
  bookingUrl,
  curriculumDemoGrades,
  curriculumDemoSubjects,
  curriculumSources
} from "../site-data";

export const metadata = {
  title: "Curriculum-Aligned Demo Sessions | NovaSprout Learning",
  description:
    "Explore grade-wise, curriculum-aligned demo sessions for math, science, ELA, study skills, coding, and data skills."
};

export default function CurriculumDemoPage() {
  return (
    <main className="landing-page">
      <header className="site-header">
        <a className="brand" href="/" aria-label="NovaSprout Learning home">
          <img className="brand-logo" src="/novasprout-logo.png" alt="" />
          <span>NovaSprout Learning</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="/#subjects">Subjects</a>
          <a href="/#how-it-works">How it works</a>
          <a href="/pricing">Pricing</a>
          <TrackedLink className="nav-cta" eventName="book_meeting_click" href={bookingUrl} target="_blank">
            Book a Free Demo
          </TrackedLink>
        </nav>
      </header>

      <section className="landing-hero compact-hero">
        <div>
          <p className="eyebrow">Curriculum-aligned demos</p>
          <h1>Classwise demo sessions built around major U.S. learning standards.</h1>
          <p>
            NovaSprout can organize demo lessons by grade, subject, and learning goal using public
            standards frameworks. We do not copy school-owned syllabi; we create original tutoring
            sessions aligned to widely used expectations.
          </p>
          <div className="hero-actions">
            <TrackedLink className="button primary" eventName="book_meeting_click" href={bookingUrl} target="_blank">
              <CalendarCheck aria-hidden="true" size={18} />
              Book a Free Demo
            </TrackedLink>
            <a className="button secondary" href="#demo-library">
              Explore Demo Library
            </a>
          </div>
        </div>
        <div className="landing-panel">
          <Layers3 aria-hidden="true" size={42} />
          <h2>What the demo generator prepares</h2>
          <p>
            A tutor-ready lesson outline with explanation, guided practice, quick checks, and a
            suggested next step for the student.
          </p>
        </div>
      </section>

      <section className="section" id="demo-library">
        <div className="section-heading">
          <p className="eyebrow">Grade-wise starting map</p>
          <h2>Start with broad grade bands, then expand into full classwise units.</h2>
          <p>
            This first version gives families a clear preview while NovaSprout builds a deeper
            topic-by-topic library for each grade and subject.
          </p>
        </div>
        <div className="support-grid situation-grid">
          {curriculumDemoGrades.map((grade) => (
            <article className="support-card" key={grade.band}>
              <span className="subject-icon">
                <ClipboardList aria-hidden="true" size={24} />
              </span>
              <p className="mini-label">{grade.grades}</p>
              <h3>{grade.band}</h3>
              <p>{grade.focus}</p>
              <p>{grade.demo}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="resources-section">
        <div className="section-heading">
          <p className="eyebrow">Subject demo formats</p>
          <h2>Each subject follows a simple tutoring structure.</h2>
        </div>
        <div className="resource-grid">
          {curriculumDemoSubjects.map((subject) => (
            <article key={subject.subject}>
              <CheckCircle2 aria-hidden="true" size={24} />
              <h3>{subject.subject}</h3>
              <p>{subject.standardsBase}</p>
              <ul className="compact-list">
                {subject.sampleTopics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
              <span className="mini-label">{subject.demoOutput}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="split-section">
        <div>
          <p className="eyebrow">AI-assisted tutoring operations</p>
          <h2>Use AI for preparation and follow-up, with human tutors leading live support.</h2>
          <p>
            AI can help generate explanations, practice, lesson plans, quick checks, reports, and
            routine administration. The public offer should stay clear: students receive live online
            support, and AI helps make that support more organized and responsive.
          </p>
        </div>
        <div className="tutor-list">
          {aiTutoringWorkflow.map((item) => (
            <article className="tutor-card" key={item}>
              <span className="subject-icon">
                <Bot aria-hidden="true" size={22} />
              </span>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Standards sources</p>
          <h2>Build from public standards, not copied school materials.</h2>
          <p>
            These sources can guide the curriculum map. NovaSprout should create original
            explanations, examples, practice questions, and assessments for each topic.
          </p>
        </div>
        <div className="source-list">
          {curriculumSources.map((source) => (
            <a href={source.href} key={source.label} rel="noreferrer" target="_blank">
              {source.label}
              <ArrowRight aria-hidden="true" size={16} />
            </a>
          ))}
        </div>
      </section>

      <section className="booking-section">
        <div className="booking-copy">
          <p className="eyebrow">Next step</p>
          <h2>Choose a grade, subject, and topic for the first demo.</h2>
          <p>
            Start with one curriculum-aligned demo session. After that, NovaSprout can expand the
            topic into a classwise learning path with practice and progress notes.
          </p>
        </div>
        <div className="booking-actions">
          <TrackedLink className="button primary full" eventName="book_meeting_click" href={bookingUrl} target="_blank">
            Book a Free Demo
            <ArrowRight aria-hidden="true" size={18} />
          </TrackedLink>
          <a className="button secondary full" href="/find-a-tutor">
            Request a Tutor
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
