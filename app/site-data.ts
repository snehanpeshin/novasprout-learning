import {
  BarChart3,
  Beaker,
  BookOpenCheck,
  Calculator,
  Code2
} from "lucide-react";

const defaultBookingUrl = "https://calendly.com/novasprout-learning/free-15-min-intro-call";

export const bookingUrl =
  [process.env.NEXT_PUBLIC_BOOKING_URL, process.env.NEXT_PUBLIC_CALENDLY_SNEHAN].find((url) =>
    url?.startsWith("https://")
  ) ?? defaultBookingUrl;

const defaultContactEmail = "novasproutlearning@gmail.com";
const envContactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export const contactEmail =
  envContactEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(envContactEmail)
    ? envContactEmail
    : defaultContactEmail;

export const contactPhone = "+1 775-248-8317";
export const contactPhoneHref = "tel:+17752488317";

export const subjectTracks = [
  {
    slug: "math-tutoring",
    navTitle: "Math",
    title: "Online Math Tutoring",
    icon: Calculator,
    accent: "green",
    level: "Elementary through high school",
    hero: "Math support that makes each step easier to follow.",
    copy:
      "A patient tutor helps the student find the missing step, practice the method, and explain their reasoning with confidence.",
    summary: "Concept gaps, homework strategy, problem solving, and test preparation.",
    challenges: [
      "The student understands examples but gets stuck working alone.",
      "Fractions, algebra, or word problems have created a persistent gap.",
      "An upcoming test needs a focused and realistic review plan."
    ],
    topics: [
      "Number sense and operations",
      "Fractions, decimals, and percentages",
      "Pre-algebra and algebra",
      "Geometry and measurement",
      "Functions, graphs, and data",
      "Word problems and test preparation"
    ],
    session: [
      "Review the exact concept or assignment causing difficulty",
      "Model a representative problem step by step",
      "Practice similar questions with immediate feedback",
      "End with a clear method and next practice step"
    ],
    benefits: ["Clearer mathematical reasoning", "More independent problem solving", "A calmer approach to practice"],
    faq: [
      ["Can tutoring follow the student's school curriculum?", "Yes. Families can share the course, current unit, and examples of the skills being taught so the tutor can align support appropriately."],
      ["Does the tutor complete homework for the student?", "No. The tutor can clarify instructions and guide representative problems while helping the student do their own work."],
      ["Can sessions focus on test preparation?", "Yes. The tutor can identify priority topics, practice question types, and help the student build a manageable review plan."]
    ]
  },
  {
    slug: "science-tutoring",
    navTitle: "Science & STEM",
    title: "Online Science & STEM Tutoring",
    icon: Beaker,
    accent: "sky",
    level: "Middle school through college preparation",
    hero: "Science tutoring built around understanding, not memorizing.",
    copy:
      "Students connect vocabulary, diagrams, evidence, and real examples so scientific ideas become easier to explain and apply.",
    summary: "Biology, chemistry and physics foundations, scientific reasoning, and data interpretation.",
    challenges: [
      "New vocabulary is hiding the main scientific idea.",
      "The student needs help interpreting a diagram, graph, or experiment.",
      "A biology, chemistry, or physics unit needs a clearer foundation."
    ],
    topics: [
      "Biology and life science foundations",
      "Chemistry concepts and matter",
      "Physics, force, motion, and energy",
      "Scientific method and experiments",
      "Graphs, evidence, and data interpretation",
      "STEM project reasoning"
    ],
    session: [
      "Map the key system, process, or scientific relationship",
      "Use diagrams and real examples to make the concept concrete",
      "Work through evidence-based questions",
      "Check understanding with a short explanation or practice task"
    ],
    benefits: ["Stronger conceptual understanding", "Better use of evidence", "More confident scientific explanations"],
    faq: [
      ["Which sciences are available?", "Support may include biology, chemistry and physics foundations, scientific reasoning, and data interpretation when an appropriate tutor is available."],
      ["Can a tutor help with lab reports?", "A tutor can explain the scientific method, help interpret results, and give feedback on structure without doing graded work for the student."],
      ["Is STEM project mentoring available?", "Yes, when the project and required subject expertise fit current tutor availability."]
    ]
  },
  {
    slug: "coding-data-skills",
    navTitle: "Coding & Data",
    title: "Online Coding & Data-Skills Tutoring",
    icon: Code2,
    accent: "coral",
    level: "Teens, college students, and adult learners",
    hero: "Build coding and data skills through practical projects.",
    copy:
      "Learners write code, inspect real data, and build small projects with guidance that connects each technical idea to something useful.",
    summary: "Python, SQL, spreadsheets, analysis, dashboards, and project-based mentoring.",
    challenges: [
      "Tutorials make sense, but starting a project still feels difficult.",
      "Code errors are frustrating and the learner needs a debugging method.",
      "The learner wants practical data skills for school, work, or a portfolio."
    ],
    topics: [
      "Python fundamentals",
      "SQL and database basics",
      "Excel and Google Sheets",
      "Data cleaning and analysis",
      "Charts and dashboards",
      "Small project planning and debugging"
    ],
    session: [
      "Define one useful project goal",
      "Explain the technical idea with a working example",
      "Build or debug a small piece together",
      "Leave the learner with a clear next feature or practice task"
    ],
    benefits: ["Practical technical confidence", "A repeatable debugging process", "Projects that demonstrate learning"],
    faq: [
      ["Do I need coding experience?", "No. Matching considers the learner's current experience, from complete beginner to more focused project support."],
      ["Which tools can sessions cover?", "Current areas include Python, SQL, spreadsheets, data analysis, and dashboards, subject to tutor availability."],
      ["Can tutoring support a portfolio project?", "Yes. A tutor can help scope the work, explain concepts, review progress, and coach the learner through their own implementation."]
    ]
  },
  {
    slug: "study-skills",
    navTitle: "Study Skills",
    title: "Online Study-Skills Coaching",
    icon: BookOpenCheck,
    accent: "amber",
    level: "Elementary through college preparation",
    hero: "Study routines that make schoolwork feel more manageable.",
    copy:
      "Students practice planning, note-taking, review, and self-checking strategies around the schoolwork they already need to complete.",
    summary: "Organization, note-taking, test preparation, and independent learning routines.",
    challenges: [
      "Assignments are missed or started too late.",
      "Notes do not make sense when it is time to review.",
      "The student studies for a long time without a clear strategy."
    ],
    topics: [
      "Weekly planning and prioritization",
      "Homework routines",
      "Useful note-taking",
      "Test preparation",
      "Breaking down large assignments",
      "Independent learning and self-checking"
    ],
    session: [
      "Identify the routine creating the most friction",
      "Choose one simple strategy that fits the student",
      "Practice it using current schoolwork",
      "Set a small plan the student can repeat independently"
    ],
    benefits: ["More organized schoolwork", "Better preparation habits", "Greater ownership of learning"],
    faq: [
      ["Is this subject tutoring?", "Study-skills coaching focuses on how a student plans, takes notes, prepares, and learns. It can complement subject tutoring but does not replace specialized academic support."],
      ["Can parents discuss learning goals first?", "Yes. The Free Demo Class is a good place to share current routines and decide which skill should be addressed first."],
      ["Will one session fix organization problems?", "Usually not. The goal is to introduce a realistic routine, practice it, and adjust it over time when ongoing support is useful."]
    ]
  }
] as const;

export const generalFaqs = [
  ["Is the Free Demo Class really free?", "Yes. The Free Demo Class does not require payment or a commitment to continue."],
  ["Which ages and levels do you support?", "Support ranges from elementary school through college preparation depending on the subject. Coding and data mentoring may also suit college students and adults."],
  ["Which subjects are available?", "NovaSprout currently focuses on math, science and STEM, coding and data skills, and study-skills coaching."],
  ["How are tutors selected?", "Tutors submit their subjects, levels, experience, availability, and approach. NovaSprout reviews applications before considering a tutor for a student request."],
  ["How does matching work?", "We review the subject, level, goals, learning needs, personality fit, availability, and time zone, then recommend a suitable available tutor."],
  ["What if the first tutor is not the right fit?", "Contact us within 24 hours of the first paid session. Under the fit guarantee, we will offer a refund for that session or a replacement session."],
  ["Where do sessions take place?", "Sessions take place online using a familiar meeting tool such as Google Meet or Zoom."],
  ["How long is a session?", "The length is confirmed before booking based on the student's needs and tutor availability."],
  ["Can parents discuss goals before starting?", "Yes. Parents or guardians can share goals and relevant context in the request and during the Free Demo Class."],
  ["What is the cancellation policy?", "Paid single sessions are refundable when cancelled at least 24 hours before the scheduled time. See the full Refund Policy for exceptions and package details."]
] as const;
