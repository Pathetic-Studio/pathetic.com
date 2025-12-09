// app/api/starter-pack/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * IMPORTANT:
 * - Set GEMINI_MODEL_ID in your env to the actual Gemini 3 model ID
 *   from Google AI Studio (e.g. whatever they expose for "Gemini 3 Flash/Pro"
 *   that supports image output).
 * - This fallback string is just a placeholder; override it in env.
 */
const MODEL_ID = process.env.GEMINI_MODEL_ID || "gemini-3.0-flash";

const STARTER_PACK_PROMPT = `
Generate a @PATHETIC-style starter pack using the attached fit pic.

Requirements:
- Remove the person, isolate only clothing/items.
- Use up-to-date, recent (as of summer 2025) trends to inform the meme and be specific about certain brands, patterns, items, or tropes that you can pick out and recognize. 
- This should be biting, funny, and in-line with the references attached. 
- Include a single, witty title (Arial Narrow font) at the top that captures the vibe, aesthetic, or archetype of the outfit in the top 10% of the image height. 
- Do not place any other elements (items or captions) inside this top 10% title band.
- Avoid generic titles like "Textures and Patterns Starter Pack."
- Below the title band, arrange exactly FOUR items in a clean 2x2 square grid.
- Each grid cell should be a square.
- Each item should have a short, cutting caption directly underneath it, funny caption describing the item in meme tone, inside its own cell area.
-  Make the output cutting, funny, and insanely relevant to modern fashion/meme culture.
- Use a flat, pure white background.
- Do NOT overlap items. Leave generous margins between items and the canvas edges.
- Keep everything inside a safe framing area so no text or items are cropped.
- Output as a single image in roughly 5:6 aspect ratio.
`;


export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("image");

        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { error: "Missing image file" },
                { status: 400 }
            );
        }

        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json(
                { error: "Image too large (max ~20MB)" },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: file.type || "image/png",
            },
        };

        // If Gemini 3 requires generationConfig (e.g. responseMimeType),
        // add it here once you know the exact required config from docs.
        const model = genAI.getGenerativeModel({
            model: MODEL_ID,
        });

        const result = await model.generateContent([
            { text: STARTER_PACK_PROMPT },
            imagePart,
        ]);

        const response = result.response;
        const candidates = response.candidates || [];

        let dataUrl: string | null = null;

        if (candidates.length) {
            const parts = candidates[0].content?.parts || [];
            for (const part of parts) {
                const inline = (part as any).inlineData;
                if (inline?.data) {
                    const mime = inline.mimeType || "image/png";
                    dataUrl = `data:${mime};base64,${inline.data}`;
                    break;
                }
            }
        }

        if (!dataUrl) {
            console.error(
                "Gemini did not return inlineData image. Full response:",
                JSON.stringify(response, null, 2)
            );

            return NextResponse.json(
                {
                    error:
                        "Gemini did not return an image (check model ID / config / quota).",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({ image: dataUrl });
    } catch (err: any) {
        console.error("starter-pack error", err);

        const message =
            err?.message ||
            err?.error?.message ||
            "Internal server error from Gemini";

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
