// app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { writeClient } from "@/sanity/lib/write-client";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => null);

        if (!body || typeof body !== "object") {
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            );
        }

        const name = String(body.name ?? "").trim();
        const email = String(body.email ?? "").trim();
        const message = String(body.message ?? "").trim();

        if (!name || !email || !message) {
            return NextResponse.json(
                { error: "Name, email and message are required" },
                { status: 400 }
            );
        }

        // 1) Store in Sanity
        try {
            await writeClient.create({
                _type: "contactSubmission",
                name,
                email,
                message,
                submittedAt: new Date().toISOString(),
            });
        } catch (err) {
            console.error("[CONTACT] Failed to write to Sanity", err);
            // still continue to try email, but report failure overall
        }

        // 2) Send email via Gmail SMTP (or other SMTP)
        const {
            EMAIL_HOST,
            EMAIL_PORT,
            EMAIL_SECURE,
            EMAIL_USER,
            EMAIL_PASS,
            CONTACT_TO_EMAIL,
        } = process.env;

        if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS || !CONTACT_TO_EMAIL) {
            console.warn("[CONTACT] Email env vars missing, skipping email send");
        } else {
            try {
                const transporter = nodemailer.createTransport({
                    host: EMAIL_HOST,
                    port: Number(EMAIL_PORT),
                    secure: EMAIL_SECURE === "true", // true for 465, false for 587
                    auth: {
                        user: EMAIL_USER,
                        pass: EMAIL_PASS,
                    },
                });

                await transporter.sendMail({
                    from: `"Contact form" <${EMAIL_USER}>`,
                    to: CONTACT_TO_EMAIL,
                    replyTo: email,
                    subject: `New contact from ${name}`,
                    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
                    html: `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, "<br />")}</p>
          `,
                });
            } catch (err) {
                console.error("[CONTACT] Failed to send email", err);
                // don't expose internals in response
            }
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[CONTACT] Unexpected error", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
