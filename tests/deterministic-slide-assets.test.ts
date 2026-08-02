import assert from "node:assert/strict";
import test from "node:test";

import { deterministicAssetPlan, mergeFallbackImages } from "../app/lib/deterministicSlideAssets.ts";

test("keeps both the WWI map and trench image when the AI plans only one visual", () => {
  const slideTitles = [
    "World War I: Causes, Trench Warfare, and Consequences",
    "The Wartime Coalitions Changed",
    "How A Trench System Worked"
  ];
  const fallback = deterministicAssetPlan({
    grade: "Grades 6-8",
    slideTitles,
    subject: "Social Studies",
    topic: "World War I causes, trench warfare, and consequences"
  });
  const aiMap = {
    assetId: "ai-wwi-map",
    placement: "2rb",
    prompt: "A historically accurate map of the principal coalitions and fronts in Europe in 1914.",
    type: "image"
  };
  const images = mergeFallbackImages([aiMap], fallback)
    .filter((asset) => asset.type === "image");

  assert.equal(images.length, 2);
  assert.ok(images.some((asset) => asset.assetId === "wwi-trench-cross-section-image"));
  assert.ok(images.some((asset) => /map of the principal coalitions/i.test(String(asset.prompt ?? ""))));
  assert.match(String(fallback.find((asset) => asset.assetId === "wwi-trench-cross-section-image")?.prompt), /communication trench.*support trench.*dugout/i);
});
