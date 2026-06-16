"use client";

import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Mail,
  Sparkles
} from "lucide-react";
import TrackedLink from "./components/TrackedLink";
import { bookingUrl, contactEmail, intakeForm, pricingPlans, processSteps, resourceItems, subjectTracks } from "./site-data";

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
          <a href="/resources">Resources</a>
          <a href="/pricing">Pricing</a>
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
            <TrackedLink className="button primary" eventName="book_meeting_click" href={bookingUrl} target="_blank">
              <CalendarCheck aria-hidden="true" size={18} />
              Book a free consultation
            </TrackedLink>
            <TrackedLink className="button secondary" eventName="intake_form_click" href={intakeForm} target="_blank">
              <BookOpen aria-hidden="true" size={18} />
              Student intake form
            </TrackedLink>
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
          {subjectTracks.map((subject) => (
            <a className="subject-card" href={`/${subject.slug}`} key={subject.title}>
              <subject.icon aria-hidden="true" size={24} />
              <h3>{subject.title}</h3>
              <p>{subject.summary}</p>
              <span>{subject.level}</span>
            </a>
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
        <div className="steps wide-steps">
          {processSteps.map((step, index) => (
            <div className="step" key={step.title}>
              <span>{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
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
          {resourceItems.slice(0, 3).map((resource) => (
            <article key={resource.title}>
              <resource.icon aria-hidden="true" size={24} />
              <h3>{resource.title}</h3>
              <p>{resource.copy}</p>
              <span className="mini-label">{resource.type}</span>
            </article>
          ))}
        </div>
        <a className="text-link" href="/resources">Explore all resources</a>
      </section>

      <section className="section" id="pricing">
        <div className="section-heading">
          <p className="eyebrow">Pricing</p>
          <h2>Start with a free intro call, then choose the support rhythm that fits.</h2>
        </div>
        <div className="pricing-grid">
          {pricingPlans.map((plan) => (
            <article className="price-card" key={plan.title}>
              <h3>{plan.title}</h3>
              <strong>{plan.price}</strong>
              <p>{plan.copy}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <CheckCircle2 aria-hidden="true" size={17} />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
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
          <TrackedLink className="button primary full" eventName="book_meeting_click" href={bookingUrl} target="_blank">
            Book a meeting
            <ArrowRight aria-hidden="true" size={18} />
          </TrackedLink>
          <TrackedLink className="button secondary full" eventName="intake_form_click" href={intakeForm} target="_blank">
            Complete intake form
          </TrackedLink>
          <a className="email-link" href={`mailto:${contactEmail}`}>
            <Mail aria-hidden="true" size={18} />
            {contactEmail}
          </a>
        </div>
      </section>

      <footer>
        <span>NovaSprout Learning, a brand of Karigari Home LLC</span>
        <span>Online tutoring for curious, growing students.</span>
        <a href="/privacy">Privacy Policy</a>
      </footer>
    </main>
  );
}
