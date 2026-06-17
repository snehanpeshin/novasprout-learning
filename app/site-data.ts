import { BarChart3, Beaker, BookOpenCheck, Calculator, Code2, FileText, PlayCircle, Target } from "lucide-react";

export const bookingUrl =
  process.env.NEXT_PUBLIC_BOOKING_URL ??
  process.env.NEXT_PUBLIC_CALENDLY_SNEHAN ??
  "https://calendly.com/YOUR-CALENDLY/free-consultation";

export const intakeForm =
  process.env.NEXT_PUBLIC_INTAKE_FORM_URL ?? "https://forms.gle/YOUR-GOOGLE-FORM";

export const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@novasproutlearning.com";

export const subjectTracks = [
  {
    slug: "math-tutoring",
    title: "Math Confidence",
    navTitle: "Math",
    icon: Calculator,
    summary: "Focused support for homework, concept gaps, test prep, and step-by-step problem solving.",
    level: "Elementary to high school",
    hero: "Math tutoring that turns confusion into small wins.",
    copy:
      "Students build fluency through friendly explanations, worked examples, practice routines, and patient support for the exact topics causing friction.",
    outcomes: ["Number sense and operations", "Fractions, decimals, and percentages", "Pre-algebra and algebra basics", "Word problem strategy"],
    resources: ["Fractions made simple", "How to start word problems", "One-step equations practice"]
  },
  {
    slug: "science-tutoring",
    title: "Science & STEM",
    navTitle: "Science",
    icon: Beaker,
    summary: "Biology, scientific reasoning, real-world examples, and practical science explanations.",
    level: "Middle school to college prep",
    hero: "Science tutoring that grows curiosity and clear thinking.",
    copy:
      "We help students connect school science to real examples, experiments, diagrams, data, and the habit of asking better questions.",
    outcomes: ["Biology foundations", "Scientific method and experiments", "Data and graph interpretation", "STEM project mentoring"],
    resources: ["How to take science notes", "Reading graphs in science", "What makes a good experiment?"]
  },
  {
    slug: "coding-data-skills",
    title: "Coding & Data Skills",
    navTitle: "Coding/Data",
    icon: Code2,
    summary: "Python, SQL, spreadsheets, data analysis, dashboards, and project-based technical mentoring.",
    level: "Teens, college, adult learners",
    hero: "Coding and data skills taught through practical projects.",
    copy:
      "Students learn technical ideas through small projects: code that runs, data they can inspect, and dashboards that make information easier to understand.",
    outcomes: ["Python basics", "SQL and databases", "Excel or Google Sheets", "Data visualization and dashboards"],
    resources: ["Python variables and input", "SQL SELECT basics", "What is data and why does it matter?"]
  },
  {
    slug: "study-skills",
    title: "Study Skills",
    navTitle: "Study Skills",
    icon: BookOpenCheck,
    summary: "Note-taking, test prep, organization, confidence, and learning routines that stick.",
    level: "Elementary to college prep",
    hero: "Study skills that help students feel organized and ready.",
    copy:
      "We coach students on how to prepare, organize, ask questions, track progress, and turn tutoring sessions into habits that carry into school.",
    outcomes: ["Clean note-taking", "Homework planning", "Test preparation", "Independent learning habits"],
    resources: ["How to study before a math test", "Clean notes in 10 minutes", "How to ask better questions"]
  }
];

export const processSteps = [
  {
    title: "Tell us the goal",
    copy: "Complete a short intake form so we understand the student's grade, subject, confidence level, and current challenges."
  },
  {
    title: "Book a free intro call",
    copy: "Meet online, discuss needs, and decide which in-house tutor and weekly rhythm makes sense."
  },
  {
    title: "Start weekly sessions",
    copy: "Each session focuses on clear explanations, practice, and a small next step the student can actually finish."
  },
  {
    title: "Receive notes and practice",
    copy: "Students and parents get simple follow-up notes, resources, and suggested practice after tutoring."
  }
];

export const resourceItems = [
  {
    title: "Fractions made simple",
    track: "Math",
    type: "Video + notes",
    icon: PlayCircle,
    copy: "A short lesson on what fractions mean, how to simplify them, and where students usually get stuck."
  },
  {
    title: "How to start word problems",
    track: "Math",
    type: "Practice notes",
    icon: FileText,
    copy: "A student-friendly checklist for turning a paragraph into numbers, labels, and a first equation."
  },
  {
    title: "Science notes that make sense",
    track: "Science",
    type: "Template",
    icon: Beaker,
    copy: "A simple structure for vocabulary, diagrams, observations, and questions after class."
  },
  {
    title: "Python variables and input",
    track: "Coding",
    type: "Video + starter code",
    icon: Code2,
    copy: "A beginner coding mini-lesson with a tiny program students can modify."
  },
  {
    title: "What is data?",
    track: "Data",
    type: "Video + worksheet",
    icon: BarChart3,
    copy: "A friendly intro to rows, columns, charts, and asking useful questions from information."
  },
  {
    title: "Test prep planning sheet",
    track: "Study Skills",
    type: "Download",
    icon: Target,
    copy: "A one-page plan for what to review, when to practice, and how to avoid last-minute panic."
  }
];

export const pricingPlans = [
  {
    title: "Free intro call",
    price: "$0",
    copy: "A quick fit check for the student's goals, subject needs, schedule, and next step.",
    features: ["15-minute online call", "Subject and goal review", "Recommended tutoring path"]
  },
  {
    paymentLink: process.env.NEXT_PUBLIC_STRIPE_NOVASPROUT_TUTORING_PAYMENT_LINK,
    productKey: "tutoring_session",
    title: "Tutoring session",
    price: "Contact us",
    copy: "Best for homework help, a difficult unit, or trying one tutoring session before a package.",
    features: ["Live online session", "Personalized notes", "Practice suggestions"]
  },
  {
    paymentLink: process.env.NEXT_PUBLIC_STRIPE_NOVASPROUT_MONTHLY_PAYMENT_LINK,
    productKey: "monthly_subscription",
    title: "Monthly subscription",
    price: "Contact us",
    copy: "A recurring support rhythm for students who need weekly tutoring and follow-up.",
    features: ["Recurring online tutoring", "Session notes and practice", "Parent/student progress updates"]
  }
] satisfies Array<{
  copy: string;
  features: string[];
  paymentLink?: string;
  price: string;
  productKey?: "tutoring_session" | "monthly_subscription";
  title: string;
}>;
