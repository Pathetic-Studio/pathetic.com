//components/contact/contact-form.tsx
"use client";

import { useState, FormEvent } from "react";
import { useContactModal } from "./contact-modal-context";
import { Button } from "@/components/ui/button";

type ContactFormData = {
    name: string;
    email: string;
    message: string;
};

export default function ContactForm() {
    const { close } = useContactModal();
    const [form, setForm] = useState<ContactFormData>({
        name: "",
        email: "",
        message: "",
    });
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [error, setError] = useState<string | null>(null);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStatus("submitting");
        setError(null);

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error || "Failed to submit form");
            }

            setStatus("success");
            setForm({ name: "", email: "", message: "" });
            // Optionally close modal after success
            // close();
        } catch (err: any) {
            setStatus("error");
            setError(err.message || "Something went wrong");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">

            {/* Name */}
            <div className="grid grid-cols-3 items-center gap-3">
                <label htmlFor="name" className="font-normal uppercase underline">
                    Name
                </label>
                <input
                    id="name"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="col-span-2  border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-black"
                />
            </div>

            {/* Email */}
            <div className="grid grid-cols-3 items-center gap-3">
                <label htmlFor="email" className="font-normal uppercase underline">
                    Email
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="col-span-2  border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-black"
                />
            </div>

            {/* Message */}
            <div className="grid grid-cols-3 gap-3">
                <label htmlFor="message" className="font-normal uppercase underline mt-1">
                    Message
                </label>
                <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    className="col-span-2  border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-black"
                />
            </div>

            {status === "error" && (
                <p className="text-xs text-red-600">{error ?? "Error submitting form"}</p>
            )}
            {status === "success" && (
                <p className="text-xs text-green-600">Thanks, your message has been sent.</p>
            )}

            <div className="flex justify-between pt-2">
                <Button
                    type="button"
                    onClick={close}
                    variant="menu"
                    className="border border-border px-3 py-1.5 text-xs font-medium "
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="default"
                    disabled={status === "submitting"}
                    className="  px-4 py-1.5 text-xs font-medium  disabled:opacity-60"
                >
                    {status === "submitting" ? "Sending..." : "Send message"}
                </Button>
            </div>
        </form>

    );
}
