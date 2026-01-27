// app/api/booth/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { boothLogger } from "@/lib/booth-logger";

export const runtime = "nodejs";

// Lazy-initialize Stripe client to avoid build-time errors
let stripe: Stripe | null = null;
function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripe;
}

function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET!;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    console.error("[booth/webhook] Missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, sig, getWebhookSecret());
  } catch (err: any) {
    console.error("[booth/webhook] Signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  const supabase = await createServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.payment_status !== "paid") {
          console.log("[booth/webhook] Payment not completed, skipping");
          break;
        }

        const userId = session.metadata?.user_id;
        const credits = parseInt(session.metadata?.credits || "0", 10);
        const packId = session.metadata?.pack_id;

        if (!userId || !credits) {
          console.error("[booth/webhook] Missing metadata:", session.metadata);
          break;
        }

        // SECURITY: Check if already processed (prevents replay attacks)
        const { data: existingPurchase } = await supabase
          .from("purchases")
          .select("status")
          .eq("stripe_session_id", session.id)
          .single();

        if (existingPurchase?.status === "completed") {
          console.log("[booth/webhook] Session already processed, skipping:", session.id);
          break;
        }

        // Update purchase status to completed
        const { error: purchaseError } = await supabase
          .from("purchases")
          .update({ status: "completed" })
          .eq("stripe_session_id", session.id)
          .eq("status", "pending"); // Only update if still pending (extra safety)

        if (purchaseError) {
          console.error("[booth/webhook] Failed to update purchase:", purchaseError);
        }

        // Add credits to user
        const { data: creditResult, error: creditError } = await supabase.rpc(
          "add_credits",
          {
            p_user_id: userId,
            p_amount: credits,
            p_type: "purchase",
            p_stripe_payment_id: session.payment_intent as string,
          }
        );

        if (creditError) {
          console.error("[booth/webhook] Failed to add credits:", creditError);
          // Mark purchase as failed so it can be investigated
          await supabase
            .from("purchases")
            .update({ status: "failed" })
            .eq("stripe_session_id", session.id);
          break;
        }

        boothLogger.purchase({
          userId,
          amount: session.amount_total || 0,
          credits,
          packId: packId || "unknown",
          sessionId: session.id,
          status: "completed",
          newCredits: creditResult?.[0]?.new_credits,
        });

        console.log(
          `[booth/webhook] Added ${credits} credits to user ${userId}`
        );
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Update purchase status to failed
        await supabase
          .from("purchases")
          .update({ status: "failed" })
          .eq("stripe_session_id", session.id);

        const userId = session.metadata?.user_id;
        if (userId) {
          // Increment failed payment count for rate limiting
          await supabase.rpc("check_rate_limit", {
            p_identifier: userId,
            p_action: "failed_payment",
            p_max_count: 999, // Just increment, don't block
            p_window_minutes: 60,
          });
        }

        console.log(`[booth/webhook] Session expired: ${session.id}`);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const userId = paymentIntent.metadata?.user_id;
        const credits = parseInt(paymentIntent.metadata?.credits || "0", 10);
        const packId = paymentIntent.metadata?.pack_id;

        if (!userId || !credits) {
          console.log("[booth/webhook] PI missing metadata:", paymentIntent.metadata);
          break;
        }

        // Idempotency check
        const { data: existingPIPurchase } = await supabase
          .from("purchases")
          .select("status")
          .eq("stripe_session_id", paymentIntent.id)
          .single();

        if (existingPIPurchase?.status === "completed") {
          console.log("[booth/webhook] PI already processed:", paymentIntent.id);
          break;
        }

        // Mark purchase completed
        const { error: piPurchaseError } = await supabase
          .from("purchases")
          .update({ status: "completed" })
          .eq("stripe_session_id", paymentIntent.id)
          .eq("status", "pending");

        if (piPurchaseError) {
          console.error("[booth/webhook] Failed to update PI purchase:", piPurchaseError);
        }

        // Add credits
        const { data: piCreditResult, error: piCreditError } = await supabase.rpc(
          "add_credits",
          {
            p_user_id: userId,
            p_amount: credits,
            p_type: "purchase",
            p_stripe_payment_id: paymentIntent.id,
          }
        );

        if (piCreditError) {
          console.error("[booth/webhook] Failed to add credits for PI:", piCreditError);
          await supabase
            .from("purchases")
            .update({ status: "failed" })
            .eq("stripe_session_id", paymentIntent.id);
          break;
        }

        boothLogger.purchase({
          userId,
          amount: paymentIntent.amount,
          credits,
          packId: packId || "quick-buy",
          sessionId: paymentIntent.id,
          status: "completed",
          newCredits: piCreditResult?.[0]?.new_credits,
        });

        console.log(`[booth/webhook] Quick-buy: added ${credits} credits to ${userId}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[booth/webhook] Payment failed: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`[booth/webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[booth/webhook] Error processing webhook:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
