// app/api/booth/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { boothLogger } from "@/lib/booth-logger";

export const runtime = "nodejs";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

const MODEL_ID = process.env.GEMINI_MODEL_ID || "gemini-3.0-flash";
const genAI = new GoogleGenerativeAI(apiKey);

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

// Prompts loaded from environment variables (not in repo for IP protection)
function getStarterPackPrompt(): string {
  const prompt = process.env.STARTER_PACK_PROMPT;
  if (!prompt) throw new Error("STARTER_PACK_PROMPT environment variable is not set");
  return prompt;
}

function getWojakPrompt(): string {
  const prompt = process.env.WOJAK_PROMPT;
  if (!prompt) throw new Error("WOJAK_PROMPT environment variable is not set");
  return prompt;
}

type GeminiPart = { text: string } | { inlineData: { data: string; mimeType: string } };

async function loadReferenceImageParts(
  refImages: Array<{ filename: string; mimeType: string }>
): Promise<GeminiPart[]> {
  const parts: GeminiPart[] = [];

  for (const ref of refImages) {
    const filePath = path.join(process.cwd(), "public", ref.filename);

    try {
      const buffer = await fs.readFile(filePath);
      const base64Data = buffer.toString("base64");

      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: ref.mimeType,
        },
      });
    } catch (err) {
      console.error(`[booth/generate] Failed to load reference image: ${ref.filename}`, err);
      continue;
    }
  }

  return parts;
}

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in to generate memes", requireAuth: true },
        { status: 401 }
      );
    }

    const serviceClient = await createServiceClient();

    // Check rate limit
    const { data: rateCheck } = await serviceClient.rpc("check_rate_limit", {
      p_identifier: user.id,
      p_action: "generation",
      p_max_count: 10,
      p_window_minutes: 1,
    });

    if (rateCheck && !rateCheck[0]?.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a minute before generating more memes." },
        { status: 429 }
      );
    }

    // Get current credits (server-side check)
    const { data: userData, error: userError } = await serviceClient
      .from("users")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "Something went wrong, try again in a minute" },
        { status: 500 }
      );
    }

    if (userData.credits <= 0) {
      return NextResponse.json(
        { error: "No credits remaining", requireCredits: true, credits: 0 },
        { status: 402 }
      );
    }

    const creditsBefore = userData.credits;

    // Deduct credit BEFORE generation
    const { data: deductResult, error: deductError } = await serviceClient.rpc(
      "deduct_credit",
      { p_user_id: user.id }
    );

    if (deductError || !deductResult?.[0]?.success) {
      const errorMsg = deductResult?.[0]?.error_message || "Failed to deduct credit";
      if (errorMsg === "Insufficient credits") {
        return NextResponse.json(
          { error: "No credits remaining", requireCredits: true, credits: 0 },
          { status: 402 }
        );
      }
      return NextResponse.json(
        { error: "Something went wrong, try again in a minute" },
        { status: 500 }
      );
    }

    const creditsAfter = deductResult[0].new_credits;

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("image");
    const styleMode = formData.get("styleMode") || "pathetic";

    if (!file || !(file instanceof File)) {
      // Refund credit if no image
      await refundCredit(serviceClient, user.id, "Missing image file");
      return NextResponse.json({ error: "Missing image file" }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      // Refund credit if image too large
      await refundCredit(serviceClient, user.id, "Image too large");
      return NextResponse.json({ error: "Image too large (max ~20MB)" }, { status: 400 });
    }

    // Proceed with generation
    try {
      const arrayBuffer = await file.arrayBuffer();
      const userBase64 = Buffer.from(arrayBuffer).toString("base64");

      const userImagePart: GeminiPart = {
        inlineData: {
          data: userBase64,
          mimeType: file.type || "image/png",
        },
      };

      const isWojak = styleMode === "wojak";
      const currentPrompt = isWojak ? getWojakPrompt() : getStarterPackPrompt();
      const currentRefs = isWojak ? WOJAK_REFERENCE_IMAGES : REFERENCE_IMAGES;

      const referenceParts = await loadReferenceImageParts(currentRefs);

      const parts: GeminiPart[] = [
        { text: currentPrompt },
        ...referenceParts,
        userImagePart,
      ];

      const model = genAI.getGenerativeModel({ model: MODEL_ID });
      const result = await model.generateContent(parts);
      const response = result.response;

      const promptFeedback = (response as any).promptFeedback;
      if (promptFeedback?.blockReason) {
        // Refund on blocked prompt
        await refundCredit(serviceClient, user.id, "Prompt blocked by Gemini");
        return NextResponse.json(
          {
            error: "Generation failed - your credit has been refunded",
            refunded: true,
            credits: creditsAfter + 1,
          },
          { status: 400 }
        );
      }

      const candidates = (response as any).candidates ?? [];
      if (!candidates.length) {
        // Refund on empty response
        await refundCredit(serviceClient, user.id, "Empty Gemini response");
        return NextResponse.json(
          {
            error: "Generation failed - your credit has been refunded",
            refunded: true,
            credits: creditsAfter + 1,
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
        // Refund on no image returned
        await refundCredit(serviceClient, user.id, "No image in Gemini response");
        return NextResponse.json(
          {
            error: "Generation failed - your credit has been refunded",
            refunded: true,
            credits: creditsAfter + 1,
          },
          { status: 500 }
        );
      }

      // Log successful generation
      boothLogger.generation({
        userId: user.id,
        creditsBefore,
        creditsAfter,
        styleMode: styleMode as string,
      });

      return NextResponse.json({
        image: dataUrl,
        credits: creditsAfter,
      });
    } catch (genErr: any) {
      console.error("[booth/generate] Generation error:", genErr);

      // Auto-refund on generation failure
      await refundCredit(serviceClient, user.id, genErr?.message || "Generation failed");

      const isQuota =
        genErr?.status === 429 ||
        /RESOURCE_EXHAUSTED|quota|rate limit|too many requests/i.test(genErr?.message || "");

      if (isQuota) {
        return NextResponse.json(
          {
            error: "Daily meme limit reached, please try again tomorrow!",
            refunded: true,
            credits: creditsAfter + 1,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: "Generation failed - your credit has been refunded",
          refunded: true,
          credits: creditsAfter + 1,
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("[booth/generate] error:", err);
    return NextResponse.json(
      { error: "Something went wrong, try again in a minute" },
      { status: 500 }
    );
  }
}

async function refundCredit(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  userId: string,
  reason: string
) {
  try {
    await supabase.rpc("add_credits", {
      p_user_id: userId,
      p_amount: 1,
      p_type: "refund",
      p_stripe_payment_id: null,
    });

    boothLogger.refund({
      userId,
      reason,
    });
  } catch (err) {
    console.error("[booth/generate] Failed to refund credit:", err);
  }
}
