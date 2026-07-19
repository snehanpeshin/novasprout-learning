import {
  ArrowRight,
  BookOpenCheck,
  Bot,
  Calculator,
  CalendarCheck,
  CheckCircle2,
  Code2,
  FlaskConical,
  Video
} from "lucide-react";
import ContactForm from "./components/ContactForm";
import Footer from "./components/Footer";
import TrackedLink from "./components/TrackedLink";
import { bookingUrl } from "./site-data";

const subjects = [
  {
    copy: "Homework, concepts, problem solving, and test preparation.",
    icon: Calculator,
    title: "Math"
  },
  {
    copy: "Biology, chemistry, physics, and scientific reasoning.",
    icon: FlaskConical,
    title: "Science"
  },
  {
    copy: "Reading, writing, note-taking, and study organization.",
    icon: BookOpenCheck,
    title: "English & Study Skills"
  },
  {
    copy: "Python, data, spreadsheets, and beginner technology projects.",
    icon: Code2,
    title: "Coding & Data"
  }
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="NovaSprout Learning home">
          <img className="brand-logo" src="/novasprout-logo.png" alt="" />
          <span>NovaSprout Learning</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#services">Services</a>
          <a href="#subjects">Subjects</a>
          <a href="#pricing">Pricing</a>
          <a href="#contact">Contact</a>
          <TrackedLink className="nav-cta" eventName="book_meeting_click" href={bookingUrl} target="_blank">
            Free Live Demo
          </TrackedLink>
        </nav>
      </header>

      <section className="demo-strip" aria-label="Tutoring announcement">
        <div className="demo-track">
          <span>First live tutoring demo is free</span>
          <span>Live tutoring is $20 per class</span>
          <span>AI Tutor and Live Tutoring are separate choices</span>
          <span>First live tutoring demo is free</span>
          <span>Live tutoring is $20 per class</span>
          <span>AI Tutor and Live Tutoring are separate choices</span>
        </div>
      </section>

      <section className="hero single-page-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Online learning made clear</p>
          <h1>Personalized AI Lessons or Live Tutoring.</h1>
          <p className="hero-text">
            Choose self-guided AI learning or meet online with a human tutor. Start with either service.
          </p>
          <div className="hero-highlights" aria-label="Tutoring benefits">
            <span><CheckCircle2 aria-hidden="true" size={16} />All major subjects</span>
            <span><CheckCircle2 aria-hidden="true" size={16} />Grades K-12</span>
            <span><CheckCircle2 aria-hidden="true" size={16} />Simple online access</span>
          </div>
          <div className="hero-actions">
            <a className="button primary" href="/ai-lesson-generator">
              Try AI Tutor
              <ArrowRight aria-hidden="true" size={18} />
            </a>
            <TrackedLink className="button secondary" eventName="book_meeting_click" href={bookingUrl} target="_blank">
              <CalendarCheck aria-hidden="true" size={18} />
              Book Free Live Demo
            </TrackedLink>
          </div>
        </div>
        <div className="hero-media" aria-label="Children learning online with a tutor">
          <img
            alt="Crayon illustration of children learning math and science with an online tutor"
            src="/novasprout-crayon-hero.jpg"
          />
        </div>
      </section>

      <section className="section single-page-section" id="services">
        <div className="section-heading centered-heading">
          <p className="eyebrow">Two simple choices</p>
          <h2>Learn independently or with a tutor.</h2>
        </div>
        <div className="service-choice-grid concise-service-grid">
          <article className="service-choice">
            <span className="subject-icon"><Bot aria-hidden="true" size={26} /></span>
            <div>
              <h3>AI Tutor</h3>
              <p>Create a visual lesson by grade and topic, then complete practice and a timed quiz.</p>
              <a className="text-link" href="/ai-lesson-generator">Open AI Tutor</a>
            </div>
          </article>
          <article className="service-choice">
            <span className="subject-icon"><Video aria-hidden="true" size={26} /></span>
            <div>
              <h3>Live Tutoring</h3>
              <p>Meet one-to-one with a human tutor for explanation, guided practice, and follow-up.</p>
              <TrackedLink className="text-link" eventName="book_meeting_click" href={bookingUrl} target="_blank">
                Book Free Demo
              </TrackedLink>
            </div>
          </article>
        </div>
      </section>

      <section className="section single-page-subjects" id="subjects">
        <div className="section-heading centered-heading">
          <p className="eyebrow">Subjects</p>
          <h2>Focused help across school and STEM.</h2>
        </div>
        <div className="single-page-subject-grid">
          {subjects.map((subject) => (
            <article className="single-page-subject" key={subject.title}>
              <subject.icon aria-hidden="true" size={24} />
              <div>
                <h3>{subject.title}</h3>
                <p>{subject.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="process-section single-page-process" id="how-it-works">
        <div className="section-heading centered-heading">
          <p className="eyebrow">How it works</p>
          <h2>Start in three steps.</h2>
        </div>
        <div className="steps">
          <div className="step"><span>1</span><h3>Choose</h3><p>Select AI Tutor or Live Tutoring.</p></div>
          <div className="step"><span>2</span><h3>Learn</h3><p>Generate a lesson or meet your tutor online.</p></div>
          <div className="step"><span>3</span><h3>Continue</h3><p>Practice independently or schedule another class.</p></div>
        </div>
      </section>

      <section className="section single-page-pricing" id="pricing">
        <div className="section-heading centered-heading">
          <p className="eyebrow">Pricing</p>
          <h2>Simple introductory pricing.</h2>
        </div>
        <div className="pricing-grid concise-pricing-grid">
          <article className="price-card">
            <h3>AI Tutor</h3>
            <strong>Free trial</strong>
            <p>Limited free lessons, or contact us for $6 monthly access.</p>
            <a className="button primary full" href="/ai-lesson-generator">Try AI Tutor</a>
          </article>
          <article className="price-card">
            <h3>Live Tutoring Demo</h3>
            <strong>Free</strong>
            <p>Meet online, discuss the goal, and check the teaching fit.</p>
            <TrackedLink className="button primary full" eventName="book_meeting_click" href={bookingUrl} target="_blank">
              Book Free Demo
            </TrackedLink>
          </article>
          <article className="price-card">
            <h3>Live Tutoring</h3>
            <strong>$20 / class</strong>
            <p>One-to-one teaching with guided practice and follow-up notes.</p>
            <a className="button primary full" href="#contact">Contact to Start</a>
          </article>
        </div>
      </section>

      <section className="contact-page-section single-page-contact" id="contact">
        <div className="contact-page-copy">
          <p className="eyebrow">Contact</p>
          <h2>Tell us what help you need.</h2>
          <p>Send a short message about the subject, grade, goal, and preferred schedule.</p>
        </div>
        <ContactForm />
      </section>

      <Footer />
    </main>
  );
}
