import type { Metadata } from "next";
import SubjectLanding from "../components/SubjectLanding";

export const metadata: Metadata = {
  title: "Online Science & STEM Tutoring | NovaSprout Learning",
  description: "One-to-one science and STEM tutoring focused on concepts, scientific reasoning, diagrams, evidence, and data interpretation.",
  alternates: { canonical: "/science-tutoring" }
};

export default function ScienceTutoringPage() { return <SubjectLanding slug="science-tutoring" />; }
