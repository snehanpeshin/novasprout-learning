"use client";

import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  GraduationCap,
  Laptop,
  Mail,
  PlayCircle,
  Sparkles,
  Users
} from "lucide-react";

const bookingUrl =
  process.env.NEXT_PUBLIC_BOOKING_URL ??
  process.env.NEXT_PUBLIC_CALENDLY_SNEHAN ??
  "https://calendly.com/YOUR-CALENDLY/free-consultation";
const intakeForm =
  process.env.NEXT_PUBLIC_INTAKE_FORM_URL ?? "https://forms.gle/YOUR-GOOGLE-FORM";
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@novasproutlearning.com";

const subjects = [
  {
    title: "Math Confidence",
    copy: "Focused support for homework, concept gaps, test prep, and step-by-step problem solving.",
    level: "Elementary to high school"
  },
  {
    title: "Science & STEM",
    copy: "Biology, biomedical thinking, experimental reasoning, and practical science explanations.",
    level: "Middle school to college prep"
  },
  {
    title: "Coding & Data Skills",
    copy: "Python, SQL, data analysis, dashboards, statistics, and project-based technical mentoring.",
    level: "Teens, college, adult learners"
  },
  {
    title: "Reading, Writing & Study Skills",
    copy: "Clear writing, research habits, organization, confidence, and learning routines that stick.",
    level: "Elementary to college prep"
  }
];

const steps = [
  "Tell us about the student with a short intake form.",
  "Book a free online consultation with the right tutor.",
  "Start weekly tutoring with notes, resources, and clear next steps."
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="NovaSprout Learning home">
          <span className="brand-mark">N</span>
          <span>NovaSprout Learning</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#subjects">Subjects</a>
          <a href="#tutors">Tutors</a>
          <a href="#resources">Resources</a>
          <a href="#book">Book</a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Online tutoring with in-house subject tutors</p>
          <h1>Personal tutoring to nurture and sprout the seed of inquisitiveness.</h1>
          <p className="hero-text">
            NovaSprout Learning connects students with carefully selected in-house tutors for live
            online tutoring, practical study support, and guided STEM learning in a friendly,
            student-first environment.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#book">
              <CalendarCheck aria-hidden="true" size={18} />
              Book a free consultation
            </a>
            <a className="button secondary" href={intakeForm} rel="noreferrer" target="_blank">
              <BookOpen aria-hidden="true" size={18} />
              Student intake form
            </a>
          </div>
        </div>
        <div className="hero-media" aria-label="Seed growing in a nourishing learning environment">
          <img
            alt="A seed nourished in healthy soil growing into a bright young plant"
            src="/novasprout-hero.png"
          />
          <div className="hero-note">
            <Sparkles aria-hidden="true" size={18} />
            <span>Live video tutoring, custom notes, and student-friendly follow-up.</span>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Program highlights">
        <div>
          <strong>1:1 online sessions</strong>
          <span>Google Meet or Zoom</span>
        </div>
        <div>
          <strong>STEM + study support</strong>
          <span>Math, science, coding, writing</span>
        </div>
        <div>
          <strong>Small and personal</strong>
          <span>Work with our in-house tutors</span>
        </div>
      </section>

      <section className="section" id="subjects">
        <div className="section-heading">
          <p className="eyebrow">Subjects</p>
          <h2>Support for school, STEM confidence, and real-world technical skills.</h2>
        </div>
        <div className="subject-grid">
          {subjects.map((subject) => (
            <article className="subject-card" key={subject.title}>
              <GraduationCap aria-hidden="true" size={24} />
              <h3>{subject.title}</h3>
              <p>{subject.copy}</p>
              <span>{subject.level}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="split-section" id="tutors">
        <div className="section-heading">
          <p className="eyebrow">Tutors</p>
          <h2>A tutoring platform with one direct learning relationship.</h2>
        </div>
        <div className="tutor-list">
          <article className="tutor-card">
            <div className="avatar">ST</div>
            <div>
              <h3>Senior STEM Tutor</h3>
              <p>
                Doctoral-level STEM background with experience in science, engineering, research,
                data analysis, and technical mentoring. Strong fit for advanced science, STEM
                confidence, research thinking, and project-based learning.
              </p>
              <div className="tag-row">
                <span>Science</span>
                <span>STEM</span>
                <span>Research</span>
                <span>Python/Data</span>
              </div>
            </div>
          </article>
          <article className="tutor-card">
            <div className="avatar">DT</div>
            <div>
              <h3>Data & Math Tutor</h3>
              <p>
                Master's-level information systems background with experience in math support, SQL,
                Python, dashboards, analytics, cloud data tools, and structured study coaching.
                Strong fit for math, coding, data skills, and learning organization.
              </p>
              <div className="tag-row">
                <span>Math</span>
                <span>SQL</span>
                <span>Power BI</span>
                <span>Study Skills</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="process-section">
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2>A simple flow for students and parents.</h2>
        </div>
        <div className="steps">
          {steps.map((step, index) => (
            <div className="step" key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="resources-section" id="resources">
        <div className="section-heading">
          <p className="eyebrow">Resources</p>
          <h2>We got you covered with online resources, notes, and parent-teacher sessions.</h2>
        </div>
        <div className="resource-grid">
          <article>
            <PlayCircle aria-hidden="true" size={24} />
            <h3>Unlisted YouTube lessons</h3>
            <p>Embed your first free or private videos here without paying for video hosting.</p>
          </article>
          <article>
            <Laptop aria-hidden="true" size={24} />
            <h3>Session notes</h3>
            <p>Share Google Docs, PDFs, or worksheets manually until a dashboard is worth building.</p>
          </article>
          <article>
            <Users aria-hidden="true" size={24} />
            <h3>Parent updates</h3>
            <p>Send short progress notes by Gmail after sessions so students and parents know what changed.</p>
          </article>
        </div>
      </section>

      <section className="booking-section" id="book">
        <div className="booking-copy">
          <p className="eyebrow">Book</p>
          <ul>
            <li>
              <CheckCircle2 aria-hidden="true" size={18} />
              Free consultation booking
            </li>
            <li>
              <CheckCircle2 aria-hidden="true" size={18} />
              Student goals collected before the call
            </li>
            <li>
              <CheckCircle2 aria-hidden="true" size={18} />
              Online sessions through Google Meet or Zoom
            </li>
          </ul>
        </div>
        <div className="booking-actions">
          <a className="button primary full" href={bookingUrl} rel="noreferrer" target="_blank">
            Book a meeting
            <ArrowRight aria-hidden="true" size={18} />
          </a>
          <a className="button secondary full" href={intakeForm} rel="noreferrer" target="_blank">
            Complete intake form
          </a>
          <a className="email-link" href={`mailto:${contactEmail}`}>
            <Mail aria-hidden="true" size={18} />
            {contactEmail}
          </a>
        </div>
      </section>

      <footer>
        <span>NovaSprout Learning</span>
        <span>Online tutoring for curious, growing students.</span>
      </footer>
    </main>
  );
}
