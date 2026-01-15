// app/api/starter-pack/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

const MODEL_ID = process.env.GEMINI_MODEL_ID || "gemini-3.0-flash";

// Debug switches
const DEBUG = process.env.STARTER_PACK_DEBUG === "1";
const DEBUG_MODE = process.env.STARTER_PACK_DEBUG_MODE || "all"; // all | userOnly | refsOnly | promptOnly | singleRef:N

const genAI = new GoogleGenerativeAI(apiKey);

if (DEBUG) {
    console.log("[starter-pack] NODE_ENV:", process.env.NODE_ENV);
    console.log("[starter-pack] GEMINI_MODEL_ID:", MODEL_ID);
    console.log("[starter-pack] GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);
    console.log("[starter-pack] DEBUG_MODE:", DEBUG_MODE);
}

const REFERENCE_IMAGES: Array<{ filename: string; mimeType: string }> = [
    { filename: "starter-pack-refs/ref-1.webp", mimeType: "image/webp" },
    { filename: "starter-pack-refs/ref-2.webp", mimeType: "image/webp" },
    { filename: "starter-pack-refs/ref-3.webp", mimeType: "image/webp" },
    { filename: "starter-pack-refs/ref-4.webp", mimeType: "image/webp" },
    { filename: "starter-pack-refs/ref-5.webp", mimeType: "image/webp" },
    { filename: "starter-pack-refs/ref-6.webp", mimeType: "image/webp" },
];

const WOJAK_REFERENCE_IMAGES: Array<{ filename: string; mimeType: string }> = [
    { filename: "wojak-refs/ref-1.png", mimeType: "image/png" },
    { filename: "wojak-refs/ref-2.png", mimeType: "image/png" },
    { filename: "wojak-refs/ref-3.png", mimeType: "image/png" },
    { filename: "wojak-refs/ref-4.png", mimeType: "image/png" },
    { filename: "wojak-refs/ref-5.png", mimeType: "image/png" },
    { filename: "wojak-refs/ref-6.png", mimeType: "image/png" },
    { filename: "wojak-refs/ref-7.png", mimeType: "image/png" },
];

const STARTER_PACK_PROMPT = `
You will receive multiple images:
The FIRST images are reference examples showing the @PATHETIC starter pack style (layout, tone, composition, and design language).
The FINAL image is the user’s outfit / fit pic. Base all actual content on this final image only.
The reference images are style guides only. Do NOT copy their content or items.
Produce a @PATHETIC-style starter pack based on the final fit pic.

STRUCTURE REQUIREMENTS (READ CAREFULLY)
Remove the person from the final image. Isolate only clothing/items.
Use current (summer 2025) fashion trends to identify brands, tropes, patterns, or subculture signifiers.
Include one witty title at the very top (~top 10% of image height).
Use Arial Narrow font.
This top title band must contain only the title—no items, no captions.
Below the title band, arrange exactly FOUR items in a clean 2×2 grid layout.
Each grid cell must be a perfect square.
Absolutely NO visible lines, borders, strokes, dividers, boxes, shapes, or separators of ANY kind. The grid must be created purely by spatial arrangement and spacing. This is a hard constraint.
Each item has a short, cutting caption directly underneath it, contained visually within its own cell area.
Background must be pure flat white (#FFFFFF).
Items and text may NOT overlap.
Leave generous margins so nothing touches canvas edges.
Output a single image in roughly 5:6 aspect ratio.

STYLE + TONE
The meme must be biting, culturally aware, and in line with the snarky @PATHETIC tone.
Captions should be modern, punchy, and highly specific to what the model can infer from the exact clothing pieces.
Avoid generic or vague titles. Make the archetype hyper-specific.

NEGATIVE INSTRUCTIONS (DO NOT DO ANY OF THESE)
Do NOT draw grid lines, borders, boxes, separators, or any visual structure marks.
Do NOT create shadows or faint strokes that resemble separators.
Do NOT place ANY content inside the top 10% title band except the title.
Do NOT crop items or text.
Do NOT overlap elements.

Output the final result as a single image.
`.trim();

const WOJAK_PROMPT = `
# DOOMSCROLL FOREVER-Style Meme Generation Prompt

## ⚙️ Image Composition & Framing Rules
- The title text must be *fully visible and never cropped*, even at the very top of the frame.
- Leave a *clear top and bottom margin equal to at least 20% of total image height* to ensure the title and bottom elements are never cropped.
- Leave at least *10–15% margin* on left and right sides too.
- All content (title, text, and items) must fit entirely inside this "safe zone."
- Center everything inside the safe zone — no element should touch or extend to image edges.
- Maintain balanced spacing between each item and caption.
- Do not include a watermark anywhere on the post.
- Ensure captions are never repeated.
- THE ASPECT RATIO MUST BE 5:6, portrait.

## 🧠 Task
Generate a \`@DOOMSCROLL_FOREVER\`-style meme (examples attached) using the fit pic attached (the last image).
Take the fit pic and generate a chaotic wojak archetype that represents the social group, sub-culture or demographic that you can deduce that the user is part of.
The format should resemble the meme examples.

## Style Requirements
- Use the classic "soy wojak" or similar wojak character style
- Include exaggerated facial expressions
- Add labels, badges, or brand markers on clothing/items
- Include text bubbles with sarcastic or self-aware commentary
- Use the characteristic wojak art style: simple lines, expressive faces, minimalist but detailed
- Capture the ironic, self-deprecating humor typical of wojak memes
- Make it culturally specific and cutting

Output the final result as a single image in 5:6 aspect ratio.
`.trim();

type GeminiPart = { text: string } | { inlineData: { data: string; mimeType: string } };

async function loadReferenceImageParts(
    indices?: number[], 
    refImages: Array<{ filename: string; mimeType: string }> = REFERENCE_IMAGES
): Promise<GeminiPart[]> {
    const parts: GeminiPart[] = [];
    const which = indices?.length ? indices : refImages.map((_, i) => i);

    for (const idx of which) {
        const ref = refImages[idx];
        const filePath = path.join(process.cwd(), "public", ref.filename);

        try {
            const stat = await fs.stat(filePath);
            if (DEBUG) console.log("[starter-pack] ref:", ref.filename, "bytes:", stat.size);

            const buffer = await fs.readFile(filePath);
            const base64Data = buffer.toString("base64");

            parts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: ref.mimeType,
                },
            });
        } catch (err) {
            console.error(`[starter-pack] Failed to load reference image: ${ref.filename}`, err);
            continue;
        }
    }

    return parts;
}

function parseDebugMode(mode: string): { kind: string; singleRefIndex?: number } {
    if (mode.startsWith("singleRef:")) {
        const n = Number(mode.split(":")[1]);
        if (Number.isFinite(n) && n >= 1 && n <= REFERENCE_IMAGES.length) {
            return { kind: "singleRef", singleRefIndex: n - 1 };
        }
        return { kind: "all" };
    }
    if (mode === "userOnly" || mode === "refsOnly" || mode === "promptOnly" || mode === "all") {
        return { kind: mode };
    }
    return { kind: "all" };
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("image");
        const styleMode = formData.get("styleMode") || "pathetic";

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: "Missing image file" }, { status: 400 });
        }

        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json({ error: "Image too large (max ~20MB)" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const userBase64 = Buffer.from(arrayBuffer).toString("base64");

        const userImagePart: GeminiPart = {
            inlineData: {
                data: userBase64,
                mimeType: file.type || "image/png",
            },
        };

        const parsed = parseDebugMode(DEBUG_MODE);

        // Choose which prompt and refs based on styleMode
        const isWojak = styleMode === "wojak";
        const currentPrompt = isWojak ? WOJAK_PROMPT : STARTER_PACK_PROMPT;
        const currentRefs = isWojak ? WOJAK_REFERENCE_IMAGES : REFERENCE_IMAGES;

        // Decide which parts to send
        let referenceParts: GeminiPart[] = [];
        let includeRefs = true;
        let includeUser = true;
        let includePrompt = true;
        let refIndicesUsed: number[] = [];

        if (parsed.kind === "promptOnly") {
            includeRefs = false;
            includeUser = false;
        } else if (parsed.kind === "refsOnly") {
            includeUser = false;
            refIndicesUsed = currentRefs.map((_, i) => i);
            referenceParts = await loadReferenceImageParts(refIndicesUsed, currentRefs);
        } else if (parsed.kind === "userOnly") {
            includeRefs = false;
        } else if (parsed.kind === "singleRef") {
            includeRefs = true;
            includeUser = true;
            refIndicesUsed = [parsed.singleRefIndex!];
            referenceParts = await loadReferenceImageParts(refIndicesUsed, currentRefs);
        } else {
            // all
            includeRefs = true;
            includeUser = true;
            refIndicesUsed = currentRefs.map((_, i) => i);
            referenceParts = await loadReferenceImageParts(refIndicesUsed, currentRefs);
        }

        const parts: GeminiPart[] = [];
        if (includePrompt) parts.push({ text: currentPrompt });
        if (includeRefs) parts.push(...referenceParts);
        if (includeUser) parts.push(userImagePart);

        const model = genAI.getGenerativeModel({ model: MODEL_ID });
        const result = await model.generateContent(parts);
        const response = result.response;

        const promptFeedback = (response as any).promptFeedback;
        if (promptFeedback) {
            console.error("[starter-pack] promptFeedback:", JSON.stringify(promptFeedback, null, 2));
        }

        if (promptFeedback?.blockReason) {
            return NextResponse.json(
                {
                    error: "Gemini blocked the prompt",
                    blockReason: promptFeedback.blockReason,
                    promptFeedback,
                    debug: DEBUG
                        ? {
                            debugMode: DEBUG_MODE,
                            includePrompt,
                            includeRefs,
                            includeUser,
                            refsUsed: refIndicesUsed.map((i) => REFERENCE_IMAGES[i]?.filename),
                        }
                        : undefined,
                },
                { status: 400 }
            );
        }

        const candidates = (response as any).candidates ?? [];
        if (!candidates.length) {
            return NextResponse.json(
                {
                    error: "Gemini returned no candidates (empty response).",
                    promptFeedback: promptFeedback ?? null,
                    usageMetadata: (response as any).usageMetadata ?? null,
                    debug: DEBUG
                        ? {
                            debugMode: DEBUG_MODE,
                            includePrompt,
                            includeRefs,
                            includeUser,
                            refsUsed: refIndicesUsed.map((i) => REFERENCE_IMAGES[i]?.filename),
                        }
                        : undefined,
                },
                { status: 400 }
            );
        }

        let dataUrl: string | null = null;
        const contentParts = candidates[0]?.content?.parts ?? [];

        for (const part of contentParts) {
            const inline = part?.inlineData;
            if (inline?.data) {
                const mime = inline.mimeType || "image/png";
                dataUrl = `data:${mime};base64,${inline.data}`;
                break;
            }
        }

        if (!dataUrl) {
            console.error("[starter-pack] no inlineData image. Full response:", JSON.stringify(response, null, 2));
            return NextResponse.json(
                {
                    error: "Gemini did not return an inlineData image.",
                    usageMetadata: (response as any).usageMetadata ?? null,
                    candidateCount: candidates.length,
                    debug: DEBUG
                        ? {
                            debugMode: DEBUG_MODE,
                            includePrompt,
                            includeRefs,
                            includeUser,
                            refsUsed: refIndicesUsed.map((i) => REFERENCE_IMAGES[i]?.filename),
                        }
                        : undefined,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({ image: dataUrl });
    } catch (err: any) {
        console.error("[starter-pack] error", err);

        const status = err?.status ?? err?.error?.code ?? err?.response?.status;
        const rawMessage = err?.message ?? err?.error?.message ?? "";

        // Quota / rate limit / daily cap (RPD) commonly comes back as 429 + RESOURCE_EXHAUSTED-ish messaging.
        const isQuota =
            status === 429 || /RESOURCE_EXHAUSTED|quota|rate limit|too many requests/i.test(rawMessage);

        if (isQuota) {
            return NextResponse.json(
                { error: "Daily meme limit reached, please try again tomorrow!" },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: rawMessage || "Internal server error from Gemini" },
            { status: 500 }
        );
    }
}
