import {ArrowRight,BadgeCheck,Database,GraduationCap} from "lucide-react";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
export const metadata={title:"Optional Human Tutoring | NovaSprout Learning",description:"Add one-to-one online tutoring when you want extra support. Request a subject and schedule match, then meet in a free demo class.",alternates:{canonical:"/human-tutoring"}};
export default function HumanTutoringPage(){return <main className="ns-site"><SiteHeader/><section className="ns-page-hero"><p className="ns-eyebrow">Optional human support</p><h1>A person to help when you need another perspective.</h1><p>Use the AI tutor on its own, or request one-to-one online support for a persistent gap, project, or learning plan. We confirm the subject fit, availability, and session details before you book.</p><div className="ns-actions"><a className="ns-button ns-button-primary" href="/portal">Request human support <ArrowRight/></a><a className="ns-button ns-button-secondary" href="/ai-lesson-generator">Return to AI Tutor</a></div></section>
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
          <a className="ns-button ns-button-primary" href="/portal">Find a tutor fast <ArrowRight aria-hidden="true" /></a>
        </div>
      </section>


<section className="ns-section"><div className="ns-section-heading"><p className="ns-eyebrow">Choose when it helps</p><h2>Meet first, then decide.</h2><p>Start with a free demo class. Live online tutoring is $20 per class; session length and scheduling are confirmed before payment. The first paid-session fit guarantee applies to human tutoring.</p></div><div className="ns-actions"><a className="ns-button ns-button-secondary" href="/portal">Ask about a tutor match</a><a className="ns-text-link" href="/refund-policy">Read the fit guarantee</a></div></section><Footer/></main>}
