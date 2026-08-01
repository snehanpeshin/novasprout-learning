import assert from "node:assert/strict";
import test from "node:test";

import { POST as planAssets } from "../app/api/ai-slide-assets/route.ts";
import { assetsFromAiVisualPlan } from "../app/lib/aiSlideAssets.ts";
import { bridgeVisualPlanIntoLesson } from "../app/lib/visualPlanBridge.ts";

test("turns the lesson AI's visual decisions directly into renderable assets", () => {
  const assets = assetsFromAiVisualPlan({
    grade: "Grade 5",
    slideTitles: ["Plant Transport", "Root Hair Osmosis", "Capillary Worked Example"],
    subject: "Science",
    topic: "Water transport in plants",
    visualPlan: [
      {
        anchor: "concept",
        description: "A root hair cell touching moist soil with water crossing the cell membrane into xylem.",
        educationalPurpose: "Make the direction of osmosis and the connected structures visible.",
        labels: ["soil water", "root hair", "cell membrane", "xylem"],
        targetTitle: "Root Hair Osmosis",
        visualType: "labeled anatomy cutaway"
      },
      {
        anchor: "worked_example",
        description: "Compare capillary rise for two tube radii.",
        educationalPurpose: "Connect each variable to the predicted rise.",
        equation: "h = 2\\gamma\\cos\\theta/(\\rho g r)",
        targetTitle: "Capillary Worked Example",
        visualType: "equation derivation and comparison graph"
      }
    ]
  });

  assert.equal(assets.length, 2);
  assert.equal(assets[0].type, "image");
  assert.equal(assets[0].placement, "2rb");
  assert.match(assets[0].prompt, /root hair.*xylem/i);
  assert.match(assets[0].prompt, /only these exact short labels/i);
  assert.equal(assets[1].type, "latex");
  assert.equal(assets[1].placement, "3cb");
});

test("does not create a decorative asset when the AI says no visual", () => {
  const assets = assetsFromAiVisualPlan({
    grade: "Grade 7",
    slideTitles: ["Read the Source"],
    subject: "English",
    topic: "Textual evidence",
    visualPlan: [{
      anchor: "concept",
      description: "Let the student focus on the source paragraph.",
      educationalPurpose: "Reduce distraction while reading closely.",
      targetTitle: "Read the Source",
      visualType: "text only, no visual"
    }]
  });

  assert.deepEqual(assets, []);
});

test("uses distinctive topic words when matching a visual to a slide", () => {
  const assets = assetsFromAiVisualPlan({
    grade: "Grade 5",
    slideTitles: [
      "Learn how water moves through plants",
      "Understand: Water enters the roots",
      "Understand: Water then travels upward",
      "Xylem, cohesion, and adhesion"
    ],
    subject: "Science",
    topic: "Water transport in plants",
    visualPlan: [
      {
        anchor: "cover",
        description: "A whole-plant cutaway.",
        educationalPurpose: "Orient the learner.",
        targetTitle: "plant cross-section",
        visualType: "anatomy cutaway"
      },
      {
        anchor: "concept",
        description: "A continuous water column inside a xylem vessel.",
        educationalPurpose: "Show cohesion and adhesion in the transport tissue.",
        targetTitle: "xylem water column",
        visualType: "anatomy cutaway"
      }
    ]
  });

  assert.deepEqual(assets.map((asset) => asset.placement), ["1rb", "4lb"]);
});

test("returns AI-directed assets without a second AI request or supplied slide titles", async () => {
  const previousToken = process.env.AI_LESSON_ACCESS_TOKEN;
  process.env.AI_LESSON_ACCESS_TOKEN = "asset-test-token";
  try {
    const response = await planAssets(new Request("http://localhost/api/ai-slide-assets", {
      body: JSON.stringify({
        context: { grade: "Grade 5", subject: "Science", topic: "Plant transport" },
        lesson: {
          title: "Plant Transport",
          visualPlan: [{
            anchor: "concept",
            description: "A plant cutaway showing roots, xylem, stem, and leaves.",
            educationalPurpose: "Trace water through the whole plant.",
            labels: ["roots", "xylem", "stem", "leaves"],
            targetTitle: "Water Pathway",
            visualType: "labeled anatomy cutaway"
          }]
        }
      }),
      headers: { "content-type": "application/json", "x-ai-access-token": "asset-test-token" },
      method: "POST"
    }));
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.assets.length, 1);
    assert.equal(payload.assets[0].placement, "2rb");
  } finally {
    if (previousToken === undefined) delete process.env.AI_LESSON_ACCESS_TOKEN;
    else process.env.AI_LESSON_ACCESS_TOKEN = previousToken;
  }
});

test("restores AI-directed assets from a released App Store lesson payload", async () => {
  const previousToken = process.env.AI_LESSON_ACCESS_TOKEN;
  process.env.AI_LESSON_ACCESS_TOKEN = "asset-bridge-test-token";
  try {
    const bridged = bridgeVisualPlanIntoLesson({
      conceptModel: { relationships: [] },
      title: "Plant Transport",
      visualPlan: [{
        anchor: "cover",
        description: "A whole plant cutaway showing roots, xylem, stem, and leaves.",
        educationalPurpose: "Trace water through the connected plant structures.",
        labels: ["roots", "xylem", "stem", "leaves"],
        targetTitle: "Plant Transport",
        visualType: "labeled anatomy cutaway"
      }]
    });
    const oldAppLesson = { ...bridged, visualPlan: undefined };
    const response = await planAssets(new Request("http://localhost/api/ai-slide-assets", {
      body: JSON.stringify({
        context: { grade: "Grade 5", subject: "Science", topic: "Plant transport" },
        lesson: oldAppLesson
      }),
      headers: { "content-type": "application/json", "x-ai-access-token": "asset-bridge-test-token" },
      method: "POST"
    }));
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.assets.length, 1);
    assert.equal(payload.assets[0].placement, "1rb");
  } finally {
    if (previousToken === undefined) delete process.env.AI_LESSON_ACCESS_TOKEN;
    else process.env.AI_LESSON_ACCESS_TOKEN = previousToken;
  }
});
