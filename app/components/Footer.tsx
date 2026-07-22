import { Facebook, Instagram, Mail, Phone } from "lucide-react";
import { contactEmail, contactPhone, contactPhoneHref, subjectTracks } from "../site-data";

export default function Footer() {
  return (
    <footer className="ns-footer">
      <div className="ns-footer-grid">
        <div className="ns-footer-brand">
          <a className="ns-brand ns-brand-light" href="/" aria-label="NovaSprout Learning home">
            <img src="/novasprout-logo.png" alt="" width="48" height="48" />
            <span>NovaSprout <em>Learning</em></span>
          </a>
          <p>Patient, personalized online tutoring with a thoughtful matching process.</p>
          <div className="ns-social-links">
            <a href="https://www.facebook.com/profile.php?id=61591516287177" target="_blank" rel="noreferrer" aria-label="NovaSprout Learning on Facebook"><Facebook aria-hidden="true" /></a>
            <a href="https://www.instagram.com/novasprout.learning/" target="_blank" rel="noreferrer" aria-label="NovaSprout Learning on Instagram"><Instagram aria-hidden="true" /></a>
          </div>
        </div>

        <div>
          <h2>Tutoring</h2>
          {subjectTracks.map((subject) => <a key={subject.slug} href={`/${subject.slug}`}>{subject.navTitle}</a>)}
          <a href="/pricing">Pricing</a>
        </div>
        <div>
          <h2>Company</h2>
          <a href="/#how-it-works">How It Works</a>
          <a href="/#why">Why NovaSprout</a>
          <a href="/ai-lesson-generator">AI Study Tool</a>
        </div>
        <div>
          <h2>Tutors & policies</h2>
          <a href="/become-a-tutor">Become a Tutor</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/refund-policy">Refund Policy</a>
        </div>
        <div>
          <h2>Contact</h2>
          <a href={`mailto:${contactEmail}`}><Mail aria-hidden="true" />{contactEmail}</a>
          <a href={contactPhoneHref}><Phone aria-hidden="true" />{contactPhone}</a>
        </div>
      </div>
      <div className="ns-footer-bottom">
        <span>© {new Date().getFullYear()} NovaSprout Learning</span>
        <span>A brand of Karigari Home LLC</span>
      </div>
    </footer>
  );
}
