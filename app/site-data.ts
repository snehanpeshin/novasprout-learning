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

const defaultContactEmail = "novasproutlearning@gmail.com";
const envContactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export const contactEmail =
  envContactEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(envContactEmail)
    ? envContactEmail
    : defaultContactEmail;

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
    title: "Math Tutoring",
    navTitle: "Math",
    icon: Calculator,
    summary: "Focused support for homework, concept gaps, test prep, and step-by-step problem solving.",
    level: "Elementary to high school",
    hero: "Online math tutoring that makes difficult steps clearer.",
    copy:
      "Students build fluency through friendly explanations, worked examples, practice routines, and patient support for the exact topics causing friction.",
    outcomes: ["Number sense and operations", "Fractions, decimals, and percentages", "Pre-algebra and algebra basics", "Word problem strategy"],
    resources: ["Fractions made simple", "How to start word problems", "One-step equations practice"]
  },
  {
    slug: "science-tutoring",
    title: "Science and STEM Tutoring",
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
    level: "Teens, college students, and adult learners",
    hero: "Coding and data skills taught through practical projects.",
    copy:
      "Students learn technical ideas through small projects: code that runs, data they can inspect, and dashboards that make information easier to understand.",
    outcomes: ["Python basics", "SQL and databases", "Excel or Google Sheets", "Data visualization and dashboards"],
    resources: ["Python variables and input", "SQL SELECT basics", "What is data and why does it matter?"]
  },
  {
    slug: "study-skills",
    title: "Study Skills and Academic Support",
    navTitle: "Study Skills",
    icon: BookOpenCheck,
    summary: "Note-taking, test prep, organization, confidence, and learning routines that stick.",
    level: "Elementary to high school, plus college prep",
    hero: "Study skills that help students feel organized and ready.",
    copy:
      "We coach students on how to prepare, organize, ask questions, track progress, and turn tutoring sessions into habits that carry into school.",
    outcomes: ["Clean note-taking", "Homework planning", "Test preparation", "Independent learning habits"],
    resources: ["How to study before a math test", "Clean notes in 10 minutes", "How to ask better questions"]
  }
];

export const processSteps = [
  {
    title: "Try the AI tutor flow",
    copy: "Choose grade, subject, topic, and learning need so NovaSprout can prepare a structured lesson path."
  },
  {
    title: "Review a generated lesson",
    copy: "Use the AI-generated deck, timer, practice, and quiz to preview how the tutoring session can run."
  },
  {
    title: "Book one class or monthly support",
    copy: "Start with a single 1-hour AI-supported tutoring session or continue with a monthly plan."
  },
  {
    title: "Continue with notes, quiz scores, and practice",
    copy: "Human tutoring stays central, while AI-generated materials support explanations, exams, and follow-up."
  }
];

export const learningSituations = [
  {
    title: "Homework has become frustrating",
    icon: ClipboardCheck,
    copy: "Your student needs patient help with the worksheet, chapter, or concept causing friction."
  },
  {
    title: "A test or exam is approaching",
    icon: CalendarClock,
    copy: "Build a focused review plan, practice likely question types, and clean up common mistakes."
  },
  {
    title: "A concept was missed",
    icon: SearchCheck,
    copy: "Go back to the missing step so current classwork starts to make more sense."
  },
  {
    title: "A STEM project needs support",
    icon: Lightbulb,
    copy: "Explore coding, data, science examples, or a small project with practical guidance."
  }
];

export const audiencePathways = [
  {
    title: "School students",
    copy: "Homework help, difficult concepts, test preparation, and ongoing subject support.",
    icon: BookOpenCheck
  },
  {
    title: "Teens exploring STEM and coding",
    copy: "Project-based support in Python, data, spreadsheets, and technical problem-solving.",
    icon: Code2
  },
  {
    title: "Students building better study habits",
    copy: "Organization, note-taking, planning, confidence, and consistent learning routines.",
    icon: Target
  }
];

export const sessionDeliverables = [
  "AI-generated lesson deck",
  "Live online tutor explanation",
  "Guided practice",
  "Timed quiz and score",
  "Help with current coursework or goals",
  "Follow-up notes and suggested practice",
  "A clear next step after each session"
];

export const curriculumSources = [
  {
    label: "Common Core Math and ELA",
    href: "https://corestandards.org/"
  },
  {
    label: "Next Generation Science Standards",
    href: "https://www.nextgenscience.org/standards"
  },
  {
    label: "K-12 Computer Science Framework",
    href: "https://k12cs.org/"
  },
  {
    label: "C3 Social Studies Framework",
    href: "https://eric.ed.gov/?id=ED623634"
  }
];

export const curriculumDemoGrades = [
  {
    band: "Elementary foundations",
    grades: "Grades 3-5",
    focus: "Number sense, fractions, reading comprehension, science observations, and study routines.",
    demo: "A 30-minute guided lesson with one concept, one worked example, practice, and a short parent summary."
  },
  {
    band: "Middle school bridge",
    grades: "Grades 6-8",
    focus: "Ratios, equations, graph reading, scientific reasoning, writing structure, and organization.",
    demo: "A standards-aligned demo that finds gaps, explains the topic, and recommends the next practice path."
  },
  {
    band: "High school readiness",
    grades: "Grades 9-12",
    focus: "Algebra, biology, chemistry foundations, data interpretation, test preparation, and technical projects.",
    demo: "A focused session built around the student's course, upcoming assessment, or project goal."
  },
  {
    band: "Technical mentoring",
    grades: "Teens, college, adult learners",
    focus: "Python, SQL, spreadsheets, dashboards, and project-based data skills.",
    demo: "A practical intro session that turns a learner's goal into a small project plan."
  }
];

export const curriculumDemoSubjects = [
  {
    subject: "Math",
    standardsBase: "Common Core-style skill progression",
    sampleTopics: ["Fractions and ratios", "Expressions and equations", "Functions and graphs", "Problem-solving strategy"],
    demoOutput: "Step-by-step explanation, guided problems, quick check, and next-practice set."
  },
  {
    subject: "Science and STEM",
    standardsBase: "NGSS-style science practices and topic progressions",
    sampleTopics: ["Scientific method", "Life science", "Physical science", "Data and graph interpretation"],
    demoOutput: "Concept explanation, diagram or example, reasoning questions, and a short reflection prompt."
  },
  {
    subject: "ELA and study support",
    standardsBase: "Common Core-style reading, writing, speaking, and language goals",
    sampleTopics: ["Reading comprehension", "Evidence-based writing", "Vocabulary", "Note-taking and planning"],
    demoOutput: "Reading or writing strategy, guided practice, feedback, and a simple study routine."
  },
  {
    subject: "Coding and data skills",
    standardsBase: "K-12 CS Framework-inspired concepts and practices",
    sampleTopics: ["Python basics", "SQL queries", "Spreadsheets", "Dashboards and data stories"],
    demoOutput: "Mini project, concept explanation, practice task, and recommended next build."
  }
];

export const aiTutoringWorkflow = [
  "Personalized explanations written at the student's current level.",
  "Practice questions by topic, grade band, and difficulty.",
  "Homework-style examples that match the student's current classwork or goal.",
  "Lesson plans that human tutors can review before live sessions.",
  "Basic assessments, exit tickets, and progress notes after sessions."
];

export const adminAutomationItems = [
  "Attendance tracking for completed and missed sessions.",
  "Scheduling notes, rescheduling reminders, and tutor availability records.",
  "Fee collection workflow after tutor, rate, and schedule are confirmed.",
  "Parent reports summarizing topics, practice, and recommended next steps.",
  "Tutor notes that preserve what was covered and where the student needs support.",
  "Session follow-up messages with practice links, notes, or next-session focus."
];

export const matchingSteps = [
  "Tutors apply with their subjects, levels, experience, and availability.",
  "NovaSprout reviews the application and communication fit.",
  "Student requests are matched based on subject, level, schedule, and learning needs.",
  "Availability is confirmed before payment or recurring scheduling."
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
      "NovaSprout is primarily for school-age students who need clearer explanations, regular practice, and calm online support. Coding and data-skills mentoring may also fit teens, college students, and adult learners."
  },
  {
    question: "What happens during the free demo?",
    answer:
      "The demo is an introductory session to understand the student, discuss the subject and goals, explain the tutoring format, and decide whether the match feels appropriate."
  },
  {
    question: "How are tutors selected?",
    answer:
      "NovaSprout uses a curated matching process. Tutors apply, NovaSprout reviews fit and communication style, and student requests are matched by subject, level, schedule, and learning needs."
  },
  {
    question: "How much does tutoring cost?",
    answer:
      "Individual sessions are currently listed at $40-$60 per hour, with the final rate confirmed before booking based on the tutoring arrangement. Monthly plans are custom."
  },
  {
    question: "What platforms are used for lessons?",
    answer:
      "Sessions are designed for familiar online meeting tools such as Google Meet or Zoom."
  },
  {
    question: "Do students receive notes or practice?",
    answer:
      "Yes. Tutoring is designed around live explanation plus simple follow-up notes, examples, or practice suggestions."
  },
  {
    question: "What is the first-session fit guarantee?",
    answer:
      "If the first paid session is not a good fit, contact us within 24 hours and we will offer a refund or replacement session. See the refund policy for details."
  },
  {
    question: "How do cancellation and rescheduling work?",
    answer:
      "Detailed cancellation and rescheduling rules still need to be finalized. Families should confirm timing expectations before a paid session or recurring plan."
  },
  {
    question: "Can college students or adults book technical mentoring?",
    answer:
      "Yes, for selected coding and data-skills topics when the subject, level, and schedule fit current availability."
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No. The first version is intentionally simple: book online, meet through Google Meet or Zoom, then choose the next step."
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
    title: "Free AI Tutor",
    price: "Free",
    copy: "Start with a small monthly AI lesson allowance and request live tutoring only when needed.",
    features: ["3-5 AI lessons per month", "Basic explanations and quizzes", "Limited PDF downloads", "Live tutor request option"]
  },
  {
    title: "Student AI Tutor",
    price: "$9.99-$14.99 / month",
    copy: "A practical AI tutor subscription for regular lessons, quizzes, worksheets, and saved study history.",
    features: ["More AI lessons", "Comprehensive lessons and quizzes", "Lesson PDFs and worksheets", "Optional paid live tutoring"]
  },
  {
    title: "Student Plus AI Tutor",
    price: "$19.99-$29.99 / month",
    copy: "Higher-use AI tutoring for all subjects, exam preparation, adaptive quizzes, and progress reporting.",
    features: ["High monthly lesson allowance", "All subjects", "Adaptive quizzes and exam prep", "Priority live tutor requests"]
  },
  {
    title: "Family AI Tutor",
    price: "$29.99-$49.99 / month",
    copy: "Shared AI tutoring access for multiple student profiles with parent-friendly progress and live tutor booking.",
    features: ["3-5 student profiles", "Shared lesson credits", "Weekly progress reports", "Parent-tutor session option"]
  },
  {
    paymentLink: process.env.NEXT_PUBLIC_STRIPE_NOVASPROUT_ONE_HOUR_TUTORING_PAYMENT_LINK,
    productKey: "tutoring_session",
    title: "Live Tutor Request",
    price: "$40-$60 / hour",
    copy: "Escalate from AI Tutor to a human tutor when the student needs direct explanation or guided practice.",
    features: ["One-time session", "AI lesson context shared", "Quiz weak areas reviewed", "Packages available by request"]
  }
] satisfies Array<{
  copy: string;
  features: string[];
  paymentLink?: string;
  price: string;
  productKey?: "tutoring_session" | "monthly_subscription";
  title: string;
}>;
