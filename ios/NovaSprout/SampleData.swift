import Foundation

enum SampleData {
    static let context = LessonContext(
        grade: "Grades 3-5",
        subject: "Mathematics",
        topic: "Equivalent fractions"
    )

    static let lesson = GeneratedLesson(
        conceptExplanation: "Equivalent fractions name the same amount even though they use different numbers. Multiplying or dividing the numerator and denominator by the same nonzero number keeps the fraction's value unchanged.",
        customPlan: nil,
        duration: "20-minute lesson",
        fullLessonSegments: [
            LessonSegment(
                activity: "Imagine two identical chocolate bars. One is divided into two equal pieces and the other into four equal pieces. One half covers the same amount as two fourths.",
                time: "5-10 min",
                title: "See the same amount"
            ),
            LessonSegment(
                activity: "Use a multiplication pattern: one half becomes two fourths by multiplying both numbers by two. It becomes three sixths by multiplying both numbers by three.",
                time: "10-15 min",
                title: "Build equivalent fractions"
            )
        ],
        guidedExample: "To find a fraction equivalent to three fifths, multiply the numerator and denominator by two: three times two is six, and five times two is ten. Therefore three fifths equals six tenths.",
        learningObjectives: [
            "Recognize fractions that represent the same amount.",
            "Generate an equivalent fraction using multiplication.",
            "Explain an answer using a visual model or number pattern."
        ],
        mode: "Sample lesson",
        parentTutorNotes: nil,
        practiceQuestions: [
            "Try: Complete 2/3 = ?/9. Hint: What multiplies 3 to make 9? Answer: 6/9.",
            "Try: Is 4/8 equivalent to 1/2? Hint: Simplify 4/8. Answer: Yes, divide both numbers by 4."
        ],
        prerequisiteCheck: ["Name the numerator and denominator in 3/4."],
        quickAssessment: ["Write one fraction equivalent to 2/5 and explain your multiplier."],
        recommendedNextSession: "Compare fractions with different denominators using benchmarks and visual models.",
        studentFit: "A short, visual sample for an elementary learner.",
        timedExam: TimedExam(
            durationMinutes: 4,
            passingScore: 67,
            questions: [
                ExamQuestion(
                    answerIndex: 1,
                    explanation: "Multiplying both 1 and 3 by 2 gives 2/6.",
                    options: ["1/6", "2/6", "3/6", "4/6"],
                    question: "Which fraction is equivalent to 1/3?"
                ),
                ExamQuestion(
                    answerIndex: 2,
                    explanation: "Eight twelfths simplifies to two thirds when both numbers are divided by 4.",
                    options: ["4/12", "6/12", "8/12", "10/12"],
                    question: "Which fraction is equivalent to 2/3?"
                ),
                ExamQuestion(
                    answerIndex: 0,
                    explanation: "Equivalent fractions multiply or divide the numerator and denominator by the same nonzero number.",
                    options: ["Use the same multiplier", "Change only the numerator", "Add the denominator", "Reverse both numbers"],
                    question: "What rule keeps a fraction equivalent?"
                )
            ]
        ),
        title: "Equivalent Fractions",
        warmUp: "Draw a rectangle, shade one half, and then divide each half into two equal pieces. How many fourths are shaded?"
    )
}
