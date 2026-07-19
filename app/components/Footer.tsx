import { contactEmail, contactPhone, contactPhoneHref } from "../site-data";

export default function Footer() {
  return (
    <footer>
      <div>
        <span>NovaSprout Learning, a brand of Karigari Home LLC</span>
        <span>Online tutoring for curious, growing students.</span>
      </div>
      <nav className="footer-links" aria-label="Footer links">
        <a href="/#services">Services</a>
        <a href="/ai-lesson-generator">AI Tutor</a>
        <a href="/#contact">Contact</a>
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        <a href={contactPhoneHref}>{contactPhone}</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/refund-policy">Refund Policy</a>
        <a href="https://www.facebook.com/profile.php?id=61591516287177" target="_blank" rel="noreferrer">
          Facebook
        </a>
        <a href="https://www.instagram.com/novasprout.learning/" target="_blank" rel="noreferrer">
          Instagram
        </a>
      </nav>
    </footer>
  );
}
