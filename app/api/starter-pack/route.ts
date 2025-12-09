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
 Image composition & framing rules:
    - The title text must be **fully visible and never cropped**, even at the very top of the frame.
    - Leave a **clear top and bottom margin equal to at least 20% of total image height** to ensure the title and bottom elements are never cropped.
    - Leave at least **10–15% margin** on left and right sides too.
    - All content (title, text, and items) must fit entirely inside this "safe zone."
    - Center everything inside the safe zone — no element should touch or extend to image edges.
    - Maintain balanced spacing between each item and caption.

    Generate a @PATHETIC-style starter pack (examples attached) using the fit pic I attached (the last image). 
    Take the fit pic and isolate each clothing piece to create the meme.

    Use up-to-date, recent (as of summer 2025) trends to inform the meme and be specific about certain brands, patterns, items, or tropes that you can pick out and recognize. 
    This should be biting, funny, and in-line with the references attached. 

    Format:
    - A single, witty title at the top that captures the vibe, aesthetic, or archetype of the outfit. 
    • Titles should be like the sample images based on the image content itself. 
    • Avoid generic titles like "Textures and Patterns Starter Pack."
    - Isolated clothing items below, each with a short, funny caption describing the item in meme tone.

    Remove any person from the output, isolating only the clothing items. 
    Make the output cutting, funny, and insanely relevant to modern fashion/meme culture.
    
    The image output should be in 5:6 aspect ratio.

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
