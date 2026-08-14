import Foundation

enum SampleData {
    static let context = LessonContext(
        grade: "Grades 6-8",
        subject: "Mathematics",
        topic: "Ratios and proportions"
    )

    static let lesson = GeneratedLesson(
        conceptExplanation: "A ratio compares two quantities in a chosen order. Equivalent ratios keep the same multiplicative relationship, and a unit rate compares a quantity to one unit.",
        conceptModel: nil,
        customPlan: nil,
        duration: "20-minute lesson",
        fullLessonSegments: [
            LessonSegment(
                activity: "Read ratios in words, fraction form, and colon form. Keep the quantities in the stated order.",
                time: "3-7 min",
                title: "Read a ratio"
            ),
            LessonSegment(
                activity: "Use a table and double number line to show that multiplying both quantities by the same scale factor creates an equivalent ratio.",
                time: "7-13 min",
                title: "Build equivalent ratios"
            ),
            LessonSegment(
                activity: "Find a unit rate, set up a proportion, and check the result against the original relationship.",
                time: "13-18 min",
                title: "Solve and check"
            )
        ],
        guidedExample: "A recipe uses 2 cups of flour for 3 batches. For 12 batches, the scale factor is 4, so 2 times 4 equals 8 cups. Check: 8/12 simplifies to 2/3.",
        learningObjectives: [
            "Read and label an ordered ratio.",
            "Generate equivalent ratios with one scale factor.",
            "Find a unit rate and solve a simple proportion."
        ],
        mode: "Real lesson preview",
        parentTutorNotes: nil,
        practiceQuestions: [
            "A cyclist travels 42 miles in 3 hours. Find the unit rate.",
            "Complete 4/7 = x/21 and explain the scale factor.",
            "Decide whether y = 3x + 1 is proportional."
        ],
        prerequisiteCheck: ["Simplify 6/9 and explain the operation used."],
        quickAssessment: ["Explain how to check that two ratios are equivalent."],
        recommendedNextSession: "Apply ratios to percent, scale drawings, and multi-step word problems.",
        studentFit: "A visual Grade 6-8 sample built in the same PDF lesson format as a personalized NovaSprout lesson.",
        timedExam: TimedExam(
            durationMinutes: 4,
            passingScore: 67,
            questions: [
                ExamQuestion(
                    answerIndex: 2,
                    explanation: "Dividing 42 miles by 3 hours gives 14 miles per hour.",
                    options: ["7 mph", "12 mph", "14 mph", "21 mph"],
                    question: "A cyclist travels 42 miles in 3 hours. What is the unit rate?"
                ),
                ExamQuestion(
                    answerIndex: 1,
                    explanation: "Seven is multiplied by 3 to make 21, so four must also be multiplied by 3 to make 12.",
                    options: ["8", "12", "16", "18"],
                    question: "Complete 4/7 = x/21. What is x?"
                ),
                ExamQuestion(
                    answerIndex: 0,
                    explanation: "A proportional relationship has a graph that passes through the origin. The +1 prevents that.",
                    options: ["No, it does not pass through the origin", "Yes, every line is proportional", "Yes, because 3 is constant", "No, because x changes"],
                    question: "Is y = 3x + 1 proportional?"
                )
            ]
        ),
        title: "Ratios: Compare, Scale, and Solve",
        visualPlan: nil,
        warmUp: "Two blue counters and three coral counters are shown. Write the ratio of blue to coral in three ways."
    )

    static var pdfData: Data? {
        guard let url = Bundle.main.url(
            forResource: "NovaSprout-Ratios-Sample",
            withExtension: "pdf"
        ) else { return nil }
        return try? Data(contentsOf: url)
    }

    static let deckSummary = DeckSummary(
        pageCount: 13,
        generatedImageCount: 0,
        qualityWarnings: []
    )
}
