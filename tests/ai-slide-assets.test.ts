import assert from "node:assert/strict";
import test from "node:test";

import { assetsFromAiVisualPlan } from "../app/lib/aiSlideAssets.ts";

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
