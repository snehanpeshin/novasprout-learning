import type { Metadata } from "next";
import SubjectLanding from "../components/SubjectLanding";

export const metadata: Metadata = {
  title: "Online Math Tutoring | NovaSprout Learning",
  description: "Patient one-to-one online math tutoring for concept gaps, problem solving, homework strategy, and test preparation.",
  alternates: { canonical: "/math-tutoring" }
};

export default function MathTutoringPage() { return <SubjectLanding slug="math-tutoring" />; }
