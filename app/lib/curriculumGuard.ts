type CurriculumCheck =
  | { allowed: true }
  | { allowed: false; error: string };

const subjectPatterns: Record<string, RegExp> = {
  Mathematics: /\b(number|count|place value|add|addition|subtract|subtraction|multiply|multiplication|divide|division|arithmetic|fraction|decimal|percent|ratio|proportion|integer|negative number|equation|inequality|algebra|variable|expression|function|linear|quadratic|polynomial|exponent|radical|logarithm|sequence|series|graph|coordinate|geometry|shape|angle|triangle|polygon|circle|perimeter|area|surface area|volume|solid|prism|pyramid|cylinder|cone|sphere|symmetry|transform|measurement|length|mass|weight|time|money|statistics|data|mean|median|mode|range|probability|chance|trigonometry|calculus|derivative|integral|matrix|vector|proof|logic)\b/i,
  Science: /\b(science|scientific method|experiment|observation|hypothesis|biology|life science|organism|plant|animal|habitat|ecosystem|food chain|food web|cell|organelle|genetic|genetics|heredity|dna|evolution|adaptation|anatomy|body system|digestion|digestive system|circulation|circulatory system|respiration|respiratory system|nervous system|immune system|reproduction|health|nutrition|chemistry|matter|atom|molecule|element|compound|mixture|reaction|acid|base|periodic table|physics|force|motion|speed|velocity|acceleration|gravity|friction|energy|work|power|electricity|electric circuit|circuit|magnet|magnetism|wave|sound|light|heat|temperature|earth science|rock|mineral|soil|weather|climate|water cycle|ocean|plate tectonic|plate tectonics|earthquake|volcano|fossil|space|solar system|planet|star|moon|astronomy|environment|pollution|conservation)\b/i,
  English: /\b(english|reading|phonics|letter|alphabet|spelling|vocabulary|word|sentence|paragraph|grammar|noun|pronoun|verb|adjective|adverb|preposition|conjunction|punctuation|capitalization|comprehension|main idea|supporting detail|inference|context clue|summary|theme|character|setting|plot|conflict|point of view|figurative language|metaphor|simile|poetry|poem|fiction|nonfiction|literature|novel|short story|drama|speech|writing|essay|thesis|claim|evidence|argument|narrative|informative|research|citation|revision|editing)\b/i,
  "Social Studies": /\b(social studies|history|historical|geography|map|continent|country|state|region|culture|civilization|ancient|medieval|renaissance|revolution|war|empire|migration|exploration|colonization|indigenous|government|civics|citizen|constitution|democracy|republic|election|congress|president|court|law|rights|civil rights|economics|economy|trade|market|supply|demand|currency|resources|community|society|religion|timeline|primary source|secondary source|current event)\b/i,
  "Computer Science": /\b(computer|computer science|coding|code|program|programming|algorithm|sequence|loop|condition|variable|function|debug|binary|data|database|network|internet|web|html|css|javascript|typescript|python|swift|java|scratch|robot|robotics|cybersecurity|privacy|encryption|artificial intelligence|machine learning|logic|pseudocode|flowchart|software|hardware)\b/i,
  "Test Preparation": /\b(test|exam|quiz|practice|review|study skill|test strategy|sat|act|psat|ap exam|state assessment|standardized|math|science|english|reading|writing|history|social studies|computer science)\b/i
};

const clearlyUnsafePatterns = [
  /\b(porn|pornographic|explicit sex|sexual roleplay|nude photo|nudes)\b/i,
  /\b(how to (?:make|build|buy|hide) (?:a )?(?:bomb|weapon|gun|poison|illegal drug))\b/i,
  /\b(suicide method|how to die|kill myself|self[- ]harm instructions)\b/i,
  /\b(how to hack|steal a password|credit card fraud|identity theft)\b/i,
  /\b(bet real money|online casino|sports betting)\b/i
];

const advancedGradeRules: Array<{ pattern: RegExp; allowedGrades: string[] }> = [
  {
    pattern: /\b(calculus|derivative|integral|matrix|logarithm|trigonometry)\b/i,
    allowedGrades: ["Grades 9-10", "Grades 11-12", "College / adult"]
  },
  {
    pattern: /\b(quadratic|polynomial|chemical equation|stoichiometry|genetics|constitutional law)\b/i,
    allowedGrades: ["Grades 6-8", "Grades 9-10", "Grades 11-12", "College / adult"]
  }
];

export function checkCurriculumTopic({
  grade,
  studentQuestion,
  subject,
  topic
}: {
  grade: string;
  studentQuestion?: string;
  subject: string;
  topic: string;
}): CurriculumCheck {
  const normalizedTopic = topic.trim().replace(/\s+/g, " ");
  const fullRequest = `${normalizedTopic} ${studentQuestion ?? ""}`.trim();

  if (normalizedTopic.length < 3 || normalizedTopic.length > 90) {
    return { allowed: false, error: "Enter a school topic between 3 and 90 characters." };
  }

  if (clearlyUnsafePatterns.some((pattern) => pattern.test(fullRequest))) {
    return {
      allowed: false,
      error: "That request is not suitable for NovaSprout. Choose a safe school-learning topic."
    };
  }

  const subjectPattern = subjectPatterns[subject];
  const singularizedTopic = normalizedTopic.replace(/\b([a-z]{4,})s\b/gi, "$1");
  if (!subjectPattern || (!subjectPattern.test(normalizedTopic) && !subjectPattern.test(singularizedTopic))) {
    return {
      allowed: false,
      error: `That topic does not appear to match ${subject}. Try a curriculum topic such as ${topicExamples(subject)}.`
    };
  }

  const advancedRule = advancedGradeRules.find((rule) => rule.pattern.test(normalizedTopic));
  if (advancedRule && !advancedRule.allowedGrades.includes(grade)) {
    return {
      allowed: false,
      error: "That topic is outside the selected grade range. Choose a higher grade or a grade-appropriate topic."
    };
  }

  return { allowed: true };
}

export async function checkKidSafeContent({
  apiKey,
  studentQuestion,
  topic
}: {
  apiKey: string;
  studentQuestion?: string;
  topic: string;
}): Promise<CurriculumCheck> {
  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      body: JSON.stringify({
        input: `${topic}\n${studentQuestion ?? ""}`,
        model: "omni-moderation-latest"
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      method: "POST",
      signal: AbortSignal.timeout(12_000)
    });
    if (!response.ok) {
      return { allowed: false, error: "NovaSprout could not check this topic safely. Please try again." };
    }
    const payload = (await response.json()) as { results?: Array<{ flagged?: boolean }> };
    if (payload.results?.[0]?.flagged) {
      return {
        allowed: false,
        error: "That request is not suitable for NovaSprout. Choose a safe school-learning topic."
      };
    }
    return { allowed: true };
  } catch {
    return { allowed: false, error: "NovaSprout could not check this topic safely. Please try again." };
  }
}

function topicExamples(subject: string) {
  const examples: Record<string, string> = {
    Mathematics: "fractions, algebra, geometry, or probability",
    Science: "cells, ecosystems, forces, or the solar system",
    English: "reading comprehension, grammar, poetry, or essay writing",
    "Social Studies": "geography, government, economics, or a historical period",
    "Computer Science": "algorithms, Python, coding loops, or cybersecurity",
    "Test Preparation": "SAT math, ACT reading, or test-taking strategies"
  };
  return examples[subject] ?? "a grade-appropriate school subject";
}
