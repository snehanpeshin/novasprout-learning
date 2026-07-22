import { NextResponse } from "next/server";
import { aiAccessError, isAiAccessAllowed } from "../../lib/aiAccess";

export const runtime = "nodejs";
export const maxDuration = 300;

type ImageAssetRequest = {
  assets?: Array<{
    assetId?: string;
    alt?: string;
    aspectRatio?: string;
    caption?: string;
    educationalPurpose?: string;
    filename?: string;
    placement?: string;
    prompt?: string;
    type?: string;
  }>;
};

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: text.slice(0, 500) } };
  }
}

async function imageUrlToDataUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`generated image URL could not be downloaded with ${response.status}`);
  }

  const contentType = response.headers.get("content-type")?.split(";")[0] || "image/png";
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
  }

  if (!(await isAiAccessAllowed(request))) {
    return NextResponse.json({ error: aiAccessError }, { status: 401 });
  }

  let body: ImageAssetRequest;
  try {
    body = (await request.json()) as ImageAssetRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const imageAssets = (body.assets ?? [])
    .filter((asset) => asset.type === "image")
    .map((asset) => ({
      assetId: cleanText(asset.assetId, 40),
      alt: cleanText(asset.alt, 160),
      aspectRatio: cleanText(asset.aspectRatio, 20),
      caption: cleanText(asset.caption, 140),
      educationalPurpose: cleanText(asset.educationalPurpose, 240),
      filename: cleanText(asset.filename, 80),
      placement: cleanText(asset.placement, 8),
      prompt: cleanText(asset.prompt, 900)
    }))
    .filter((asset) => asset.prompt && asset.placement)
    .slice(0, 1);

  if (!imageAssets.length) {
    return NextResponse.json({ images: [] });
  }

  try {
    const images = await Promise.all(
      imageAssets.map(async (asset) => {
        const imageModel = process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1";
        const configuredQuality = process.env.OPENAI_IMAGE_QUALITY?.trim().toLowerCase();
        const imageQuality = ["low", "medium", "high"].includes(configuredQuality ?? "")
          ? configuredQuality
          : "medium";
        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: imageModel,
            n: 1,
            prompt: `${asset.prompt}. This is the dominant instructional visual on a NovaSprout lesson slide. Prioritize subject accuracy, clear spatial relationships, one obvious focal point, accessible contrast, clean edges, and generous negative space. Do not add embedded words, letters, labels, watermarks, frames, or decorative classroom objects.`,
            quality: imageModel === "dall-e-3" ? "standard" : imageQuality,
            size: "1024x1024"
          })
        });

        const payload = await readJsonResponse(response);

        if (!response.ok) {
          throw new Error(
            `${asset.assetId || asset.placement}: ${payload?.error?.message ?? `image generation failed with ${response.status}`}`
          );
        }

        const b64Json = payload?.data?.[0]?.b64_json;
        const imageUrl = payload?.data?.[0]?.url;
        const dataUrl =
          typeof b64Json === "string"
            ? `data:image/png;base64,${b64Json}`
            : typeof imageUrl === "string"
              ? await imageUrlToDataUrl(imageUrl)
              : "";

        if (dataUrl) {
          return {
            alt: asset.alt,
            assetId: asset.assetId,
            aspectRatio: asset.aspectRatio,
            caption: asset.caption,
            dataUrl,
            educationalPurpose: asset.educationalPurpose,
            filename: asset.filename,
            placement: asset.placement,
            prompt: asset.prompt,
            type: "image"
          };
        }

        throw new Error(`${asset.assetId || asset.placement}: image generation returned no image URL or PNG data.`);
      })
    );

    return NextResponse.json({ images: images.filter(Boolean) });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Could not reach the AI image service: ${error.message}`
            : "Could not reach the AI image service."
      },
      { status: 500 }
    );
  }
}
