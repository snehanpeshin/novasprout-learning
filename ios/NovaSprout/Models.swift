import Foundation

struct LessonRequest: Codable, Equatable {
    var grade = "Grades 6-8"
    var subject = "Mathematics"
    var topic = "Ratios and proportions"
    var level = "Teach at my grade level"
    var goal = "Concept clarity"
    var mode = "Comprehensive lesson"
    var duration = "30-minute lesson"
    var teachingStyle = "Simple and friendly"
    var difficulty = "Standard"
    var language = "English"
    var includeInLesson = [
        "Key vocabulary",
        "Diagrams",
        "Worked examples",
        "Practice questions",
        "Interactive quiz",
        "Summary notes"
    ]
    var studentQuestion = ""
}

struct LessonContext: Codable, Hashable {
    let grade: String
    let subject: String
    let topic: String
}

struct LessonSegment: Codable, Hashable, Identifiable {
    var id: String { "\(time)-\(title)" }
    let activity: String
    let time: String
    let title: String
}

struct CustomPlan: Codable, Hashable {
    let focusAreas: [String]?
    let recommendedCadence: String?
    let summary: String?
    let weeklyPlan: [String]?
}

struct ExamQuestion: Codable, Hashable, Identifiable {
    var id: String { question }
    let answerIndex: Int
    let explanation: String
    let options: [String]
    let question: String
}

struct TimedExam: Codable, Hashable {
    let durationMinutes: Int
    let passingScore: Int
    let questions: [ExamQuestion]
}

struct GeneratedLesson: Codable, Hashable {
    let conceptExplanation: String?
    let customPlan: CustomPlan?
    let duration: String?
    let fullLessonSegments: [LessonSegment]?
    let guidedExample: String?
    let learningObjectives: [String]?
    let mode: String?
    let parentTutorNotes: String?
    let practiceQuestions: [String]?
    let prerequisiteCheck: [String]?
    let quickAssessment: [String]?
    let recommendedNextSession: String?
    let studentFit: String?
    let timedExam: TimedExam?
    let title: String?
    let warmUp: String?

    var displayTitle: String {
        title?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
            ? title!
            : "NovaSprout Lesson"
    }

    var lessonMinutes: Int {
        let source = duration ?? "30"
        let digits = source.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
        return max(20, min(90, Int(digits) ?? 30))
    }
}

struct LessonStartResponse: Codable {
    let error: String?
    let lesson: GeneratedLesson?
    let responseId: String?
    let status: String?
    let warning: String?
}

struct DeckAsset: Codable, Hashable {
    let assetId: String?
    let alt: String?
    let aspectRatio: String?
    let caption: String?
    let dataUrl: String?
    let educationalPurpose: String?
    let filename: String?
    let latex: String?
    let placement: String?
    let prompt: String?
    let type: String?
}

struct AssetPlanResponse: Codable {
    let assets: [DeckAsset]?
    let error: String?
}

struct ImageGenerationResponse: Codable {
    let error: String?
    let images: [DeckAsset]?
}

struct AssetManifestItem: Codable, Hashable {
    let assetId: String?
    let filename: String?
    let placement: String?
    let type: String?
}

struct CompiledDeck: Codable {
    let assetManifest: [AssetManifestItem]?
    let compilerStatus: String?
    let error: String?
    let pageCount: Int?
    let pdfDataUrl: String?
    let pdfSize: Int?
    let pdfUrl: String?
    let qualityChecks: [String]?
    let qualityWarnings: [String]?
    let validationErrors: [String]?

    var summary: DeckSummary {
        DeckSummary(
            pageCount: pageCount ?? 0,
            generatedImageCount: assetManifest?.filter { $0.type == "image" }.count ?? 0,
            qualityWarnings: qualityWarnings ?? []
        )
    }
}

struct DeckSummary: Codable, Hashable {
    let pageCount: Int
    let generatedImageCount: Int
    let qualityWarnings: [String]

    var visualDescription: String {
        if generatedImageCount > 0 {
            return "\(pageCount) visual slides with topic diagrams and an AI-generated teaching image."
        }
        return "\(pageCount) visual slides with topic-specific diagrams and models."
    }
}

struct SavedLesson: Codable, Hashable, Identifiable {
    let id: UUID
    let context: LessonContext
    let createdAt: Date
    let lesson: GeneratedLesson
    var lastScore: Int?
    let pdfFileName: String?
    let deckSummary: DeckSummary?
}

enum GenerationStage: String, CaseIterable, Identifiable {
    case lesson = "Creating lesson"
    case visualPlan = "Planning visuals"
    case images = "Generating image"
    case compilation = "Compiling PDF"
    case quality = "Checking quality"
    case ready = "Ready"

    var id: String { rawValue }

    var detail: String {
        switch self {
        case .lesson:
            "Building a detailed lesson around the student's topic and goal."
        case .visualPlan:
            "Choosing the clearest diagrams, models, and visual examples."
        case .images:
            "Creating a topic-specific instructional image where it adds value."
        case .compilation:
            "Laying out the lesson as a polished, swipeable slide deck."
        case .quality:
            "Checking the PDF, slide count, and visual coverage."
        case .ready:
            "The private lesson is ready to study."
        }
    }
}

enum LessonOptions {
    static let grades = [
        "Pre-K / Kindergarten",
        "Grades 1-2",
        "Grades 3-5",
        "Grades 6-8",
        "Grades 9-10",
        "Grades 11-12",
        "College / adult"
    ]

    static let subjects = [
        "Mathematics",
        "Science",
        "English",
        "Social Studies",
        "Computer Science",
        "Test Preparation"
    ]

    static let goals = [
        "Concept clarity",
        "Homework help",
        "Prepare for a test",
        "Solve practice questions",
        "Build confidence",
        "Complete a school project"
    ]

    static let durations = [
        "20-minute lesson",
        "30-minute lesson",
        "45-minute comprehensive lesson",
        "60-minute deep lesson"
    ]
}

enum CurriculumTopicValidator {
    private static let keywords: [String: [String]] = [
        "Mathematics": [
            "number", "count", "place value", "addition", "subtraction", "multiplication", "division",
            "arithmetic", "fraction", "decimal", "percent", "ratio", "proportion", "integer", "equation",
            "inequality", "algebra", "variable", "expression", "function", "linear", "quadratic",
            "polynomial", "exponent", "radical", "logarithm", "sequence", "graph", "coordinate",
            "geometry", "shape", "angle", "triangle", "polygon", "circle", "perimeter", "area",
            "surface area", "volume", "solid", "prism", "pyramid", "cylinder", "cone", "sphere",
            "symmetry", "measurement", "time", "money", "statistics", "mean", "median", "mode",
            "probability", "trigonometry", "calculus", "derivative", "integral", "matrix", "vector"
        ],
        "Science": [
            "science", "scientific method", "experiment", "observation", "hypothesis", "biology", "organism",
            "plant", "animal", "habitat", "ecosystem", "food chain", "food web", "cell", "genetic", "dna",
            "evolution", "adaptation", "anatomy", "body system", "digestive", "circulatory", "respiratory",
            "nervous system", "immune system", "reproduction", "health", "nutrition", "chemistry", "matter",
            "atom", "molecule", "element", "compound", "mixture", "reaction", "acid", "base", "periodic table",
            "physics", "force", "motion", "speed", "velocity", "acceleration", "gravity", "friction", "energy",
            "electricity", "circuit", "magnet", "wave", "sound", "light", "heat", "temperature", "earth science",
            "rock", "mineral", "soil", "weather", "climate", "water cycle", "ocean", "plate tectonics",
            "earthquake", "volcano", "fossil", "space", "solar system", "planet", "star", "moon", "astronomy"
        ],
        "English": [
            "english", "reading", "phonics", "alphabet", "spelling", "vocabulary", "sentence", "paragraph",
            "grammar", "noun", "pronoun", "verb", "adjective", "adverb", "preposition", "conjunction",
            "punctuation", "comprehension", "main idea", "supporting detail", "inference", "context clue",
            "summary", "theme", "character", "setting", "plot", "point of view", "figurative language",
            "metaphor", "simile", "poetry", "fiction", "nonfiction", "literature", "novel", "short story",
            "drama", "speech", "writing", "essay", "thesis", "claim", "evidence", "argument", "narrative",
            "research", "citation", "revision", "editing"
        ],
        "Social Studies": [
            "social studies", "history", "geography", "map", "continent", "country", "state", "region", "culture",
            "civilization", "ancient", "medieval", "renaissance", "revolution", "war", "empire", "migration",
            "exploration", "colonization", "indigenous", "government", "civics", "citizen", "constitution",
            "democracy", "republic", "election", "congress", "president", "court", "law", "rights",
            "civil rights", "economics", "economy", "trade", "market", "supply", "demand", "currency",
            "resources", "community", "society", "timeline", "primary source", "current event"
        ],
        "Computer Science": [
            "computer", "coding", "code", "program", "programming", "algorithm", "sequence", "loop", "condition",
            "variable", "function", "debug", "binary", "data", "database", "network", "internet", "web", "html",
            "css", "javascript", "typescript", "python", "swift", "java", "scratch", "robot", "robotics",
            "cybersecurity", "privacy", "encryption", "artificial intelligence", "machine learning", "pseudocode"
        ],
        "Test Preparation": [
            "test", "exam", "quiz", "practice", "review", "study skill", "test strategy", "sat", "act", "psat",
            "ap exam", "state assessment", "math", "science", "english", "reading", "writing", "history"
        ]
    ]

    private static let unsafePhrases = [
        "porn", "pornographic", "explicit sex", "sexual roleplay", "nude photo", "how to make a bomb",
        "how to build a weapon", "how to buy illegal drugs", "suicide method", "how to die", "kill myself",
        "self-harm instructions", "steal a password", "credit card fraud", "online casino", "sports betting"
    ]

    static func error(topic: String, subject: String, grade: String, studentQuestion: String = "") -> String? {
        let cleaned = topic.trimmingCharacters(in: .whitespacesAndNewlines)
        let request = "\(cleaned) \(studentQuestion)".lowercased()
        guard cleaned.count >= 3 else { return "Enter a school topic." }
        guard cleaned.count <= 90 else { return "Keep the topic under 90 characters." }

        if unsafePhrases.contains(where: request.contains) {
            return "That request is not suitable for NovaSprout. Choose a safe school-learning topic."
        }

        guard keywords[subject, default: []].contains(where: { containsTerm($0, in: cleaned) }) else {
            return "That topic does not appear to match \(subject). Choose a curriculum topic for the selected subject."
        }

        let advanced = ["calculus", "derivative", "integral", "matrix", "logarithm", "trigonometry"]
        if advanced.contains(where: { containsTerm($0, in: cleaned) }),
           !["Grades 9-10", "Grades 11-12", "College / adult"].contains(grade) {
            return "That topic is outside the selected grade range. Choose a higher grade or a grade-appropriate topic."
        }
        return nil
    }

    private static func containsTerm(_ term: String, in text: String) -> Bool {
        let escaped = NSRegularExpression.escapedPattern(for: term)
        let options: String.CompareOptions = [.regularExpression, .caseInsensitive]
        if text.range(of: "\\b\(escaped)\\b", options: options) != nil {
            return true
        }
        let singularized = text.replacingOccurrences(
            of: "\\b([A-Za-z]{4,})s\\b",
            with: "$1",
            options: .regularExpression
        )
        return singularized.range(of: "\\b\(escaped)\\b", options: options) != nil
    }
}
