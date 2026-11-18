import DemoPresentation from "../components/DemoPresentation";
export const metadata = {
  title: "Present the AI Tutor | NovaSprout Learning",
  description: "Present prepared math, science, and coding demonstrations with labeled diagrams, optional narration, practice, hints, and fresh checks.",
  alternates: { canonical: "/present" }
};
export default function PresentPage() { return <DemoPresentation />; }
