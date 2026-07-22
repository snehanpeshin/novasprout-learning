import type { Metadata } from "next";
import SubjectLanding from "../components/SubjectLanding";

export const metadata: Metadata = {
  title: "Online Study-Skills Coaching | NovaSprout Learning",
  description: "Personalized online coaching for planning, organization, note-taking, test preparation, and independent learning routines.",
  alternates: { canonical: "/study-skills" }
};

export default function StudySkillsPage() { return <SubjectLanding slug="study-skills" />; }
