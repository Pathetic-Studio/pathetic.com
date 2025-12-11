import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { email, name } = await req.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json(
                { error: "Email is required." },
                { status: 400 },
            );
        }

        const apiKey = process.env.BEEHIIV_API_KEY;
        const publicationId = process.env.BEEHIIV_PUBLICATION_ID;

        if (!apiKey || !publicationId) {
            return NextResponse.json(
                { error: "Beehiiv API configuration is missing." },
                { status: 500 },
            );
        }

        const beehiivRes = await fetch(
            `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    email,
                    ...(name ? { first_name: name } : {}),
                    reactivate_existing: true,
                }),
            },
        );

        if (!beehiivRes.ok) {
            let errorBody: unknown = null;
            try {
                errorBody = await beehiivRes.json();
            } catch {
                // ignore
            }
            return NextResponse.json(
                { error: "Failed to subscribe.", details: errorBody },
                { status: 500 },
            );
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json(
            { error: "Unexpected error while subscribing." },
            { status: 500 },
        );
    }
}
