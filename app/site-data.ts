import {
  BarChart3,
  Beaker,
  BookOpenCheck,
  CalendarClock,
  Calculator,
  ClipboardCheck,
  Code2,
  FileText,
  Lightbulb,
  PlayCircle,
  SearchCheck,
  Target
} from "lucide-react";

const defaultBookingUrl = "https://calendly.com/novasprout-learning/free-15-min-intro-call";

export const bookingUrl =
  [process.env.NEXT_PUBLIC_BOOKING_URL, process.env.NEXT_PUBLIC_CALENDLY_SNEHAN].find((url) =>
    url?.startsWith("https://")
  ) ?? defaultBookingUrl;

export const intakeForm =
  process.env.NEXT_PUBLIC_INTAKE_FORM_URL ?? "https://forms.gle/YOUR-GOOGLE-FORM";

export const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "novasproutlearning@gmail.com";

export const studentRequestEmail = `mailto:${contactEmail}?subject=${encodeURIComponent(
  "NovaSprout student request"
)}&body=${encodeURIComponent(`Student name:
Grade:
Subject needed:
Main goal or challenge:
Preferred days/times:
Parent/student contact:
`)}`;

export const tutorApplicationEmail = `mailto:${contactEmail}?subject=${encodeURIComponent(
  "NovaSprout tutor application"
)}&body=${encodeURIComponent(`Name:
Email:
Subjects you can tutor:
Grade levels:
Availability:
Experience/qualification:
Link to resume, LinkedIn, or intro video:
`)}`;

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
    title: "Book the free demo",
    copy: "Choose a time online and tell us the subject, grade level, and what feels difficult right now."
  },
  {
    title: "Try one live session",
    copy: "Meet online for a friendly sample lesson with clear explanation and guided practice."
  },
  {
    title: "Pick the right plan",
    copy: "Continue with one protected tutoring session or a monthly plan, then receive notes and practice after lessons."
  }
];

export const learningSituations = [
  {
    title: "Homework feels stuck",
    icon: ClipboardCheck,
    copy: "Get patient help with the exact worksheet, chapter, or concept causing friction."
  },
  {
    title: "A test is coming",
    icon: CalendarClock,
    copy: "Build a short review plan, practice likely question types, and clean up common mistakes."
  },
  {
    title: "Curiosity needs a project",
    icon: Lightbulb,
    copy: "Use coding, data, STEM examples, or notes to turn interest into something students can show."
  }
];

export const studentRequestSteps = [
  {
    title: "Tell us the need",
    icon: SearchCheck,
    copy: "Share the subject, grade level, goals, schedule, and what kind of tutor would help."
  },
  {
    title: "We suggest a fit",
    icon: ClipboardCheck,
    copy: "NovaSprout reviews the request and recommends the best available tutor or next step."
  },
  {
    title: "Try the free demo",
    icon: CalendarClock,
    copy: "Meet online first, then continue only if the tutor and format feel right."
  }
];

export const tutorApplicationSteps = [
  {
    title: "Apply to tutor",
    icon: ClipboardCheck,
    copy: "Send your subjects, grade levels, availability, experience, and profile links."
  },
  {
    title: "Quality review",
    icon: SearchCheck,
    copy: "We review fit, communication style, background, and student support approach."
  },
  {
    title: "Join matched sessions",
    icon: CalendarClock,
    copy: "Approved tutors are matched with student requests when subject and schedule align."
  }
];

export const tutoringFaqs = [
  {
    question: "Who is NovaSprout Learning best for?",
    answer:
      "Students who want clearer explanations, regular practice, and a calm online tutor for math, science, coding, data, or study skills."
  },
  {
    question: "What happens after the free demo class?",
    answer:
      "We recommend either one protected paid session or a monthly plan based on the student's goals, schedule, and subject needs."
  },
  {
    question: "Is there a money-back option?",
    answer:
      "Yes. If the first paid session is not a good fit, contact us within 24 hours and we will offer a refund or replacement session."
  },
  {
    question: "Do students get notes or practice?",
    answer:
      "Yes. Tutoring is designed around live explanation plus simple follow-up notes, examples, or practice suggestions."
  },
  {
    question: "Can we start without creating an account?",
    answer:
      "Yes. The first version is intentionally simple: book online, meet through Google Meet or Zoom, then choose the next step."
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
    type: "Planning note",
    icon: Target,
    copy: "A one-page plan for what to review, when to practice, and how to avoid last-minute panic."
  }
];

export const pricingPlans = [
  {
    title: "Free Demo Class",
    price: "Free",
    copy: "A no-pressure first class to understand the student's goals, subject needs, and next step.",
    features: ["Free online demo", "Subject and goal review", "No monthly commitment"]
  },
  {
    paymentLink: process.env.NEXT_PUBLIC_STRIPE_NOVASPROUT_ONE_HOUR_TUTORING_PAYMENT_LINK,
    productKey: "tutoring_session",
    title: "1 Hour Tutoring",
    price: "$40-60",
    copy: "Best for homework help, a difficult unit, or trying one focused tutoring session before a package.",
    features: ["Live online session", "Personalized notes", "First-session fit guarantee"]
  },
  {
    paymentLink: process.env.NEXT_PUBLIC_STRIPE_NOVASPROUT_MONTHLY_PACKAGE_PAYMENT_LINK,
    productKey: "monthly_subscription",
    title: "Monthly Tutoring Package",
    price: "Custom plan",
    copy: "A recurring support rhythm recommended after the demo or first paid session.",
    features: ["Weekly or flexible tutoring", "Session notes and practice", "Start after fit is confirmed"]
  }
] satisfies Array<{
  copy: string;
  features: string[];
  paymentLink?: string;
  price: string;
  productKey?: "tutoring_session" | "monthly_subscription";
  title: string;
}>;
