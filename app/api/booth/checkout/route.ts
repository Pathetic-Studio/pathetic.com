// app/api/booth/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { boothLogger } from "@/lib/booth-logger";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const CREDIT_PACKS: Record<string, { credits: number; price: number; name: string }> = {
  starter: { credits: 10, price: 499, name: "Starter Pack" },
  popular: { credits: 25, price: 999, name: "Popular Pack" },
  "best-value": { credits: 60, price: 1999, name: "Best Value Pack" },
  "party-pack": { credits: 125, price: 3499, name: "Party Pack" },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { packId } = body;

    // Validate pack
    const pack = CREDIT_PACKS[packId];
    if (!pack) {
      return NextResponse.json({ error: "Invalid pack selected" }, { status: 400 });
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check rate limit for failed payments
    const serviceClient = await createServiceClient();
    const { data: rateCheck } = await serviceClient.rpc("check_rate_limit", {
      p_identifier: user.id,
      p_action: "failed_payment",
      p_max_count: 5,
      p_window_minutes: 60,
    });

    if (rateCheck && !rateCheck[0]?.allowed) {
      return NextResponse.json(
        { error: "Too many failed payment attempts. Please try again later." },
        { status: 429 }
      );
    }

    // Create Stripe checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${pack.name} - ${pack.credits} Meme Credits`,
              description: `Generate ${pack.credits} memes with your credits`,
            },
            unit_amount: pack.price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appUrl}/booth?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/booth?checkout=cancelled`,
      metadata: {
        user_id: user.id,
        pack_id: packId,
        credits: pack.credits.toString(),
      },
      customer_email: user.email,
    });

    // Create pending purchase record
    await serviceClient.from("purchases").insert({
      user_id: user.id,
      stripe_session_id: session.id,
      credits: pack.credits,
      amount_paid: pack.price,
      status: "pending",
    });

    boothLogger.purchase({
      userId: user.id,
      amount: pack.price,
      credits: pack.credits,
      packId,
      sessionId: session.id,
      status: "initiated",
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[booth/checkout] error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
