import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import FamilyPortal from "../components/FamilyPortal";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Family Portal | NovaSprout Learning",
  description: "Request short-notice online tutoring, schedule a matching call, and start with NovaSprout AI Tutor while you wait.",
  alternates: { canonical: "/portal" }
};

export default function PortalPage() {
  return <main className="ns-site ns-portal-page"><SiteHeader /><section className="ns-page-hero ns-page-hero-compact"><p className="ns-eyebrow"><Sparkles /> NovaSprout Family Portal</p><h1>Get the right help for the time you have.</h1><p>Request a tutor for a near-term need, select a matching-call time, and start an AI lesson now if the student needs help before a live class is confirmed.</p></section><section className="ns-section ns-portal-section"><FamilyPortal /></section><Footer /></main>;
}
