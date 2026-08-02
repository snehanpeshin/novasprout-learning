export type PlannedSlideAsset = Record<string, unknown> & {
  assetId: string;
  placement: string;
  type: "image" | "latex";
};

function placementForSlide(slideTitles: string[], titlePattern: RegExp, fallbackSlide: number, position: string) {
  const slideIndex = slideTitles.findIndex((title) => titlePattern.test(title));
  return `${slideIndex >= 0 ? slideIndex + 1 : fallbackSlide}${position}`;
}

export function deterministicAssetPlan({
  grade,
  slideTitles,
  subject,
  topic
}: {
  grade: string;
  slideTitles: string[];
  subject: string;
  topic: string;
}): PlannedSlideAsset[] {
  const normalizedTopic = topic.toLowerCase();

  if (normalizedTopic.includes("digest")) {
    return [{
      assetId: "digestive-system-anatomy-image",
      alt: "Student-friendly digestive system anatomical illustration without text labels.",
      aspectRatio: "1:1",
      caption: "A visual overview of the digestive organs.",
      educationalPurpose: "Helps students recognize the organs before reading the labeled diagram.",
      filename: "digestive-system-anatomy.png",
      latex: "",
      placement: placementForSlide(slideTitles, /digestive system map/i, 8, "rb"),
      prompt: `${grade} accurate simplified cutaway educational illustration of the human digestive system in a front-facing human torso. Show the mouth connected to the esophagus, stomach below the diaphragm, liver above and beside the stomach, pancreas beneath the stomach, coiled small intestine enclosed by the large intestine. Make the physical arrangement anatomically coherent and the food pathway easy to trace. Modern classroom textbook style, deep navy outlines, growth green, sky blue, warm yellow and coral accents, off-white background, no text, no labels, no decorative objects`,
      type: "image"
    }];
  }

  if (/\bworld war (?:i|1|one)\b/i.test(topic) && /\b(?:social|history)\b/i.test(subject)) {
    return [
      {
        assetId: "wwi-trench-cross-section-image",
        alt: "Student-friendly cutaway illustration of a connected World War I trench system.",
        aspectRatio: "16:9",
        caption: "A defensive network linked the front line to support positions and dugouts.",
        educationalPurpose: "Makes the spatial relationship among no-man's-land, front, communication, and support trenches visible.",
        filename: "wwi-trench-system.png",
        latex: "",
        placement: placementForSlide(slideTitles, /trench system|trench warfare|trench layout/i, 10, "rm"),
        prompt: `${grade} historically grounded educational cutaway illustration of a World War I Western Front trench system. Show opposing front lines separated by no-man's-land, barbed wire, parapets and sandbags, a front-line trench connected by a zigzag communication trench to a support trench, and a dugout below ground. Show muddy ground, defensive depth, and accurate relative placement from a slightly elevated cross-section view. Clear classroom textbook illustration, sober but student-appropriate, no gore, no words, no letters, no labels, no watermark`,
        type: "image"
      },
      {
        assetId: "wwi-europe-alliances-map-image",
        alt: "Simplified historical map of Europe showing the main World War I coalitions and fronts.",
        aspectRatio: "16:9",
        caption: "The war connected European fronts to empires and colonies around the world.",
        educationalPurpose: "Orients students to the Western and Eastern Fronts and the geographic scale of the alliances.",
        filename: "wwi-europe-alliances-map.png",
        latex: "",
        placement: placementForSlide(slideTitles, /coalitions|alliances|global scope|map/i, 6, "rm"),
        prompt: `${grade} historically accurate simplified political map of Europe at the start of World War I. Distinguish the main Central Powers from the principal Allied Powers with two accessible color families, indicate the approximate Western Front and Eastern Front with clean boundary lines, and keep neutral countries visually separate. Use 1914-era borders rather than modern borders. Flat educational atlas style, uncluttered pale background, no words, no letters, no labels, no flags, no watermark`,
        type: "image"
      }
    ];
  }

  if (/\b(?:science|biology|chemistry|physics|health|environment)\b/i.test(subject)) {
    const cellDivision = /\b(?:cell division|cell cycle|mitosis|meiosis|cytokinesis|chromosome|chromatid)\b/i.test(topic);
    return [{
      assetId: cellDivision ? "cell-division-stage-image" : "topic-system-image",
      alt: cellDivision
        ? "Student-friendly biological illustration comparing the main stages of cell division."
        : `Student-friendly scientific illustration of ${topic}.`,
      aspectRatio: "16:9",
      caption: cellDivision ? "One cell prepares, separates its chromosomes, and becomes two cells." : `A visual model of ${topic}.`,
      educationalPurpose: cellDivision
        ? "Makes chromosome movement and changes in the cell boundary visible across mitosis and cytokinesis."
        : `Gives the learner one concrete visual reference for ${topic}.`,
      filename: cellDivision ? "cell-division-stages.png" : "topic-system.png",
      latex: "",
      placement: placementForSlide(slideTitles, cellDivision ? /mitosis|cell cycle|division stages|cytokinesis/i : /overview|map|system|process|big idea/i, 2, "rm"),
      prompt: cellDivision
        ? `${grade} accurate educational biology storyboard of animal cell division from interphase through prophase, metaphase, anaphase, telophase, and cytokinesis. Show six distinct cells in sequence, chromosomes condensing, aligning at the equator, sister chromatids separating to opposite poles, two nuclei reforming, and the cleavage furrow producing two daughter cells. Keep chromosome count scientifically consistent across stages. Clean modern textbook illustration, white background, deep navy outlines, blue cell membranes, purple chromosomes, warm yellow spindle fibers, no words, no letters, no labels, no watermark`
        : `${grade} accurate educational scientific illustration of ${topic}. Show the central structures, process, scale, and cause-and-effect relationships a student must see to understand the topic. Use one coherent textbook model with a clear focal point, accurate spatial relationships, age-appropriate detail, clean white background, strong accessible contrast, no words, no letters, no labels, no watermark`,
      type: "image"
    }];
  }

  return [];
}

export function mergeFallbackImages(
  assets: Array<Record<string, unknown>>,
  fallbackAssets: Array<Record<string, unknown>>
) {
  const merged = [...assets];
  const fallbackImages = fallbackAssets.filter((asset) => asset.type === "image").slice(0, 3);
  const desiredImageCount = Math.min(3, fallbackImages.length);
  let imageCount = merged.filter((asset) => asset.type === "image").length;
  for (const fallback of fallbackImages) {
    if (imageCount >= desiredImageCount) break;
    const duplicate = merged.some((asset) =>
      asset.assetId === fallback.assetId || asset.placement === fallback.placement
    );
    if (!duplicate) {
      merged.push(fallback);
      imageCount += 1;
    }
  }
  return merged;
}
