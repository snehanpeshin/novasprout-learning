import type { Metadata } from "next";
import SubjectLanding from "../components/SubjectLanding";

export const metadata: Metadata = {
  title: "Online Coding & Data-Skills Tutoring | NovaSprout Learning",
  description: "Practical online mentoring in Python, SQL, spreadsheets, data analysis, dashboards, and project-based technical skills.",
  alternates: { canonical: "/coding-data-skills" }
};

export default function CodingDataSkillsPage() { return <SubjectLanding slug="coding-data-skills" />; }
