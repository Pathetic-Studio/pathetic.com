// app/api/newsletter/route.ts (or wherever this route lives)
import { NextResponse } from "next/server";

function getClientIp(req: Request) {
    const xff = req.headers.get("x-forwarded-for");
    if (!xff) return null;
    return xff.split(",")[0]?.trim() ?? null;
}

type Body = {
    email?: unknown;
    source?: unknown;
    website?: unknown; // honeypot
};

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as Body;

        // Honeypot: bots fill hidden fields
        if (typeof body.website === "string" && body.website.trim().length > 0) {
            // Return OK to avoid giving bots signal
            return NextResponse.json({ ok: true });
        }

        const email = typeof body.email === "string" ? body.email.trim() : "";
        const source = typeof body.source === "string" ? body.source.trim() : "";

        if (!email) {
            return NextResponse.json({ error: "Email is required." }, { status: 400 });
        }

        const apiKey = process.env.BEEHIIV_API_KEY;
        const publicationId = process.env.BEEHIIV_PUBLICATION_ID;

        if (!apiKey || !publicationId) {
            return NextResponse.json(
                { error: "Beehiiv API configuration is missing." },
                { status: 500 },
            );
        }

        const payload: Record<string, any> = {
            email,
            reactivate_existing: true,
            send_welcome_email: true,
        };

        const custom_fields: { name: string; value: string }[] = [];
        if (source) custom_fields.push({ name: "source", value: source });
        if (custom_fields.length) payload.custom_fields = custom_fields;

        const ip = getClientIp(req);
        if (ip) payload.ip_address = ip;

        const beehiivRes = await fetch(
            `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(payload),
            },
        );

        const text = await beehiivRes.text();
        const details = text
            ? (() => {
                try {
                    return JSON.parse(text);
                } catch {
                    return text;
                }
            })()
            : null;

        if (!beehiivRes.ok) {
            return NextResponse.json(
                { error: "Failed to subscribe.", details },
                { status: beehiivRes.status },
            );
        }

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json(
            { error: "Unexpected error while subscribing." },
            { status: 500 },
        );
    }
}
