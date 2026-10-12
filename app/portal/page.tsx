import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import FamilyPortal from "../components/FamilyPortal";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Family Portal | NovaSprout Learning",
  description: "Choose tutoring support, follow your match, and manage the next step in your NovaSprout learning plan.",
  alternates: { canonical: "/portal" }
};

export default function PortalPage() {
  return <main className="ns-site ns-portal-page"><SiteHeader /><section className="ns-page-hero ns-page-hero-compact"><p className="ns-eyebrow"><Sparkles /> NovaSprout Family Portal</p><h1>One place for your tutor match and learning plan.</h1><p>Choose the subject and support that fits your family. We match the request with an available tutor, then keep the recommendation, booking, and payment step together.</p></section><section className="ns-section ns-portal-section"><FamilyPortal /></section><Footer /></main>;
}
