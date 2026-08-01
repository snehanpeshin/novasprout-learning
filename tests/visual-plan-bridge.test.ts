import assert from "node:assert/strict";
import test from "node:test";

import {
  bridgeVisualPlanIntoLesson,
  restoreVisualPlanFromLesson
} from "../app/lib/visualPlanBridge.ts";

const visualPlan = [
  {
    anchor: "cover",
    description: "A whole plant cutaway showing the connected water pathway.",
    educationalPurpose: "Orient the student before tracing water through each structure.",
    equation: "",
    labels: ["roots", "xylem", "stem", "leaves"],
    layout: "dominant visual on the right",
    priority: "high",
    steps: ["Water enters roots", "Water rises through xylem"],
    targetTitle: "Plant Transport",
    visualType: "labeled anatomy cutaway"
  }
];

test("round-trips an AI visual plan through the released-app compatibility bridge", () => {
  const bridged = bridgeVisualPlanIntoLesson({
    conceptModel: {
      assessmentTargets: [],
      formulas: [],
      misconceptions: [],
      nodes: [],
      relationships: []
    },
    visualPlan
  });
  const oldAppLesson = { ...bridged, visualPlan: undefined };
  const restored = restoreVisualPlanFromLesson(oldAppLesson);

  assert.deepEqual(restored.visualPlan, visualPlan);
  assert.equal(restored.conceptModel?.relationships?.length, 0);
});

test("prefers an explicit current-client visual plan and strips compatibility metadata", () => {
  const bridged = bridgeVisualPlanIntoLesson({ conceptModel: { relationships: [] }, visualPlan });
  const replacement = [{ ...visualPlan[0], targetTitle: "Root Hair Cells" }];
  const restored = restoreVisualPlanFromLesson({ ...bridged, visualPlan: replacement });

  assert.deepEqual(restored.visualPlan, replacement);
  assert.equal(restored.conceptModel?.relationships?.length, 0);
});

test("ignores malformed compatibility data", () => {
  const restored = restoreVisualPlanFromLesson({
    conceptModel: {
      relationships: [{
        explanation: "not_base64!",
        from: "__novasprout_visual_plan_v1__",
        relationship: "encodes",
        to: "__backend_compatibility__"
      }]
    }
  });

  assert.deepEqual(restored.visualPlan, []);
  assert.equal(restored.conceptModel?.relationships?.length, 0);
});

