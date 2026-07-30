import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Check,
  CheckCircle2,
  ClipboardList,
  Code2,
  Database,
  GraduationCap,
  MessageCircleQuestion,
  SearchCheck,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Video
} from "lucide-react";
import ContactForm from "./components/ContactForm";
import Footer from "./components/Footer";
import SiteHeader from "./components/SiteHeader";
import { bookingUrl, generalFaqs, subjectTracks } from "./site-data";

const appStoreUrl = "https://apps.apple.com/us/app/novasprout-ai-tutor/id6793519745";

export const metadata: Metadata = {
  title: "Personalized Online Tutoring | NovaSprout Learning",
  description:
    "Patient one-to-one online tutoring matched to the student’s subject, level, goals, and schedule. Request a Free Demo Class before deciding.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Personalized Online Tutoring | NovaSprout Learning",
    description: "Patient one-to-one tutoring, verified in-house expertise, thoughtful matching, and a Free Demo Class.",
    images: [{ url: "/novasprout-live-tutoring-hero.png", width: 1536, height: 1024, alt: "A student learning online with a tutor" }],
    type: "website"
  }
};

const concerns = [
  { icon: MessageCircleQuestion, title: "Homework feels stressful", copy: "A patient tutor slows the problem down and gives the student a workable starting point." },
  { icon: SearchCheck, title: "A concept gap is growing", copy: "We identify the missing step and rebuild it with clear examples and guided practice." },
  { icon: Code2, title: "Practical skills need direction", copy: "Project-based support helps learners move from tutorials to code, data, and useful results." },
  { icon: ClipboardList, title: "Study habits are getting in the way", copy: "Simple planning, note-taking, and review routines make schoolwork more manageable." }
];

const sessionActivities = [
  "Clarify the concept that is causing difficulty",
  "Work through representative problems together",
  "Identify gaps without rushing past them",
  "Practice with immediate, specific feedback",
  "Finish with a realistic next-step plan"
];

export default function Home() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.novasproutlearning.com";
  const structuredData = [{
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${siteUrl}/#organization`,
    name: "NovaSprout Learning",
    url: siteUrl,
    logo: `${siteUrl}/novasprout-logo.png`,
    email: "novasproutlearning@gmail.com",
    telephone: "+1-775-248-8317",
    parentOrganization: { "@type": "Organization", name: "Karigari Home LLC" },
    sameAs: [
      "https://www.facebook.com/profile.php?id=61591516287177",
      "https://www.instagram.com/novasprout.learning/",
      appStoreUrl
    ],
    makesOffer: {
      "@type": "Offer",
      price: "20",
      priceCurrency: "USD",
      itemOffered: {
        "@type": "Service",
        name: "One-to-one online tutoring",
        serviceType: "Online tutoring",
        provider: { "@id": `${siteUrl}/#organization` }
      }
    }
  }, {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "NovaSprout AI Tutor",
    operatingSystem: "iOS",
    applicationCategory: "EducationalApplication",
    url: appStoreUrl,
    downloadUrl: appStoreUrl,
    publisher: { "@id": `${siteUrl}/#organization` }
  }, {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: generalFaqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer }
    }))
  }];

  return (
    <main className="ns-site" id="top">
      <SiteHeader />

      <section className="ns-hero" aria-labelledby="hero-title">
        <div className="ns-hero-copy">
          <p className="ns-eyebrow">Patient, live, and one-to-one</p>
          <h1 id="hero-title">Patient, one-to-one tutoring matched to how your student learns.</h1>
          <p className="ns-hero-lead">
            Tell us what’s getting in the way. We’ll recommend a patient tutor for the student’s subject, level, goals, and schedule—then you can meet in a free demo class before deciding.
          </p>
          <div className="ns-actions">
            <a className="ns-button ns-button-primary" href="#free-demo">Request a Free Demo Class <ArrowRight aria-hidden="true" /></a>
            <a className="ns-button ns-button-secondary" href="#subjects">Explore Subjects</a>
          </div>
          <div className="ns-reassurance" aria-label="NovaSprout tutoring highlights">
            <span><BadgeCheck aria-hidden="true" />Qualifications and experience reviewed</span>
            <span><SearchCheck aria-hidden="true" />Matched by subject and level</span>
            <span><CalendarCheck aria-hidden="true" />Meet before deciding</span>
          </div>
        </div>
        <figure className="ns-hero-visual">
          <Image
            src="/novasprout-live-tutoring-hero.png"
            alt="A student working through geometry with a live online tutor"
            fill
            priority
            sizes="(max-width: 800px) 100vw, 52vw"
          />
          <figcaption><span>Live online</span> Calm explanations, useful practice, and room to ask questions.</figcaption>
        </figure>
      </section>

      <section className="ns-trust-strip" aria-label="A lower-risk way to begin">
        <div><CheckCircle2 aria-hidden="true" /><span><strong>Free Demo Class</strong> before committing</span></div>
        <div><Target aria-hidden="true" /><span>Matching by <strong>subject, level, goals, and schedule</strong></span></div>
        <div><ShieldCheck aria-hidden="true" /><span><strong>First paid-session fit guarantee</strong></span></div>
      </section>

      <section className="ns-app-band" aria-labelledby="app-title">
        <Image
          className="ns-app-icon"
          src="/novasprout-ai-tutor-app-icon.png"
          alt="NovaSprout AI Tutor app icon"
          width={112}
          height={112}
        />
        <div className="ns-app-copy">
          <p className="ns-eyebrow">Now on the App Store</p>
          <h2 id="app-title">Meet NovaSprout AI Tutor.</h2>
          <p>Build personalized lessons, visual slide decks, practice, and timed checks in the NovaSprout iOS app.</p>
        </div>
        <div className="ns-app-actions">
          <a className="ns-button ns-button-primary" href={appStoreUrl} target="_blank" rel="noreferrer">
            <Smartphone aria-hidden="true" /> View on the App Store
          </a>
          <a className="ns-text-link" href="/ai-lesson-generator">Use AI Tutor on the web <ArrowRight aria-hidden="true" /></a>
        </div>
      </section>

      <section className="ns-section ns-tutor-proof" id="tutors" aria-labelledby="tutors-title">
        <div className="ns-section-heading ns-heading-row">
          <div>
            <p className="ns-eyebrow">Current in-house expertise</p>
            <h2 id="tutors-title">Meet the experience behind the matching.</h2>
          </div>
          <p>Profiles are shown without names or personal contact details. Qualifications below come from the tutors’ submitted professional records.</p>
        </div>
        <div className="ns-tutor-proof-grid">
          <article>
            <span className="ns-profile-icon"><GraduationCap aria-hidden="true" /></span>
            <div>
              <p className="ns-card-kicker">Math, physics, and engineering</p>
              <h3>STEM & engineering specialist</h3>
              <ul>
                <li>Ph.D. in Mechanical and Aerospace Engineering</li>
                <li>M.S. and B.S. degrees in Mechanical Engineering</li>
                <li>University teaching fellowship and graduate/undergraduate student supervision</li>
              </ul>
              <p><strong>Session focus:</strong> concept clarity, equations, diagrams, scientific reasoning, and worked examples.</p>
            </div>
          </article>
          <article>
            <span className="ns-profile-icon ns-profile-icon-data"><Database aria-hidden="true" /></span>
            <div>
              <p className="ns-card-kicker">Coding, data, and practical technology</p>
              <h3>Coding & data specialist</h3>
              <ul>
                <li>M.S. in Information Systems and B.Tech. in Electronics and Communication Engineering</li>
                <li>Graduate-assistant experience in data analysis and visualization</li>
                <li>Professional work with Python, SQL, Power BI, Tableau, cloud platforms, and data pipelines</li>
              </ul>
              <p><strong>Session focus:</strong> step-by-step coding, data interpretation, practical projects, and debugging.</p>
            </div>
          </article>
        </div>
        <div className="ns-tutor-review">
          <BadgeCheck aria-hidden="true" />
          <p><strong>Before a recommendation:</strong> NovaSprout reviews the tutor’s submitted background, subjects and levels, relevant experience, availability, and teaching approach against the student request.</p>
          <a className="ns-button ns-button-primary" href="#free-demo">Request a Free Demo Class <ArrowRight aria-hidden="true" /></a>
        </div>
      </section>

      <section className="ns-section ns-problems" aria-labelledby="problems-title">
        <div className="ns-section-heading">
          <p className="ns-eyebrow">Support for the real sticking points</p>
          <h2 id="problems-title">Start with what is making learning harder today.</h2>
          <p>NovaSprout focuses each match and session on a specific need, not a generic program.</p>
        </div>
        <div className="ns-problem-grid">
          {concerns.map((item) => (
            <article key={item.title}>
              <item.icon aria-hidden="true" />
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ns-section ns-subject-band" id="subjects" aria-labelledby="subjects-title">
        <div className="ns-section-heading ns-heading-row">
          <div>
            <p className="ns-eyebrow">Subject pathways</p>
            <h2 id="subjects-title">Find the right kind of support.</h2>
          </div>
          <p>Each subject has its own teaching approach, common challenges, and matching needs.</p>
        </div>
        <div className="ns-subject-grid">
          {subjectTracks.map((subject) => (
            <article className={`ns-subject-card ns-accent-${subject.accent}`} key={subject.slug}>
              <span className="ns-subject-icon"><subject.icon aria-hidden="true" /></span>
              <p className="ns-card-kicker">{subject.level}</p>
              <h3>{subject.navTitle}</h3>
              <p>{subject.summary}</p>
              <a href={`/${subject.slug}`}>Explore {subject.navTitle} <ArrowRight aria-hidden="true" /></a>
            </article>
          ))}
        </div>
      </section>

      <section className="ns-section ns-process" id="how-it-works" aria-labelledby="process-title">
        <div className="ns-section-heading ns-centered">
          <p className="ns-eyebrow">How matching works</p>
          <h2 id="process-title">One request. One thoughtful recommendation.</h2>
          <p>NovaSprout is a curated tutoring service, so families do not have to sort through an unlimited marketplace of profiles.</p>
        </div>
        <ol className="ns-steps">
          <li><span>1</span><div><h3>Tell us what the student needs</h3><p>Share the subject, level, goals, challenges, availability, and useful context.</p></div></li>
          <li><span>2</span><div><h3>We review and match</h3><p>We consider expertise, learning needs, communication fit, and schedule.</p></div></li>
          <li><span>3</span><div><h3>Meet in a Free Demo Class</h3><p>Experience the teaching style before deciding whether to continue.</p></div></li>
        </ol>
      </section>

      <section className="ns-section ns-session" aria-labelledby="session-title">
        <div className="ns-session-visual" aria-hidden="true">
          <span><Sparkles /></span>
          <div><strong>Ask</strong><p>What is the confusing step?</p></div>
          <div><strong>Work</strong><p>Try a representative example.</p></div>
          <div><strong>Check</strong><p>Explain it back in your own words.</p></div>
        </div>
        <div>
          <p className="ns-eyebrow">Inside a session</p>
          <h2 id="session-title">Focused on understanding and useful practice.</h2>
          <ul className="ns-check-list">
            {sessionActivities.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}
          </ul>
          <p className="ns-small-note">Tutors guide learning and do not complete graded assignments for students.</p>
        </div>
      </section>

      <section className="ns-section ns-pricing-preview" id="pricing" aria-labelledby="pricing-title">
        <div className="ns-section-heading ns-centered">
          <p className="ns-eyebrow">A simple way to begin</p>
          <h2 id="pricing-title">Meet first. Pay only if you continue.</h2>
        </div>
        <div className="ns-pricing-steps">
          <article><span>01</span><h3>Free Demo Class</h3><strong>$0</strong><p>Discuss the goal and experience the teaching approach.</p></article>
          <article><span>02</span><h3>First paid class</h3><strong>$20</strong><p>Protected by the first paid-session fit guarantee.</p></article>
          <article><span>03</span><h3>Ongoing tutoring</h3><strong>$20 / class</strong><p>Continue with a schedule that fits current needs and availability.</p></article>
        </div>
        <div className="ns-centered-action"><a className="ns-text-link" href="/pricing">Read pricing and guarantee details <ArrowRight aria-hidden="true" /></a></div>
      </section>

      <section className="ns-section ns-faq" aria-labelledby="faq-title">
        <div className="ns-section-heading">
          <p className="ns-eyebrow">Questions families ask</p>
          <h2 id="faq-title">Helpful details before you begin.</h2>
        </div>
        <div className="ns-faq-list">
          {generalFaqs.map(([question, answer]) => (
            <details key={question}><summary>{question}</summary><p>{answer}</p></details>
          ))}
        </div>
      </section>

      <section className="ns-demo-section" id="free-demo" aria-labelledby="demo-title">
        <div className="ns-demo-copy">
          <p className="ns-eyebrow">Free Demo Class</p>
          <h2 id="demo-title">Let’s find the right support for your student.</h2>
          <p>The NovaSprout team reviews each request. We’ll email you with an available tutor recommendation or a follow-up question; after that, you can choose a free demo time. For students under 18, a parent or guardian should complete the request.</p>
          <div className="ns-demo-options">
            <p><CheckCircle2 aria-hidden="true" />No payment required</p>
            <p><CheckCircle2 aria-hidden="true" />No commitment to continue</p>
            <p><CheckCircle2 aria-hidden="true" />Curated tutor recommendation</p>
          </div>
          <a className="ns-text-link" href={bookingUrl} target="_blank" rel="noreferrer">Already shared your details? Choose a demo time <ArrowRight aria-hidden="true" /></a>
        </div>
        <ContactForm />
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </main>
  );
}
