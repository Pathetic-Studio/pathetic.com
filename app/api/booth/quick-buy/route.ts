// app/api/booth/quick-buy/route.ts
// Creates a Stripe PaymentIntent for the quick-buy (Apple Pay / Google Pay) flow.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { boothLogger } from "@/lib/booth-logger";

export const runtime = "nodejs";

let stripe: Stripe | null = null;
function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripe;
}

const QUICK_BUY = {
  credits: 10,
  price: 999, // $9.99 in cents
  name: "Quick Buy - 10 Meme Credits",
};

export async function POST(req: NextRequest) {
  try {
    // Require authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in to purchase credits", requireAuth: true },
        { status: 401 }
      );
    }

    const serviceClient = await createServiceClient();

    // Rate limit
    const { data: rateCheck } = await serviceClient.rpc("check_rate_limit", {
      p_identifier: user.id,
      p_action: "failed_payment",
      p_max_count: 5,
      p_window_minutes: 60,
    });

    if (rateCheck && !rateCheck[0]?.allowed) {
      return NextResponse.json(
        { error: "Too many payment attempts. Please try again later." },
        { status: 429 }
      );
    }

    // Create PaymentIntent
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: QUICK_BUY.price,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        user_id: user.id,
        pack_id: "quick-buy",
        credits: QUICK_BUY.credits.toString(),
      },
    });

    // Record pending purchase
    await serviceClient.from("purchases").insert({
      user_id: user.id,
      stripe_session_id: paymentIntent.id,
      credits: QUICK_BUY.credits,
      amount_paid: QUICK_BUY.price,
      status: "pending",
    });

    boothLogger.purchase({
      userId: user.id,
      amount: QUICK_BUY.price,
      credits: QUICK_BUY.credits,
      packId: "quick-buy",
      sessionId: paymentIntent.id,
      status: "initiated",
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error("[booth/quick-buy] error:", err);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
