// components/newsletter/newsletter-form.tsx
"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNewsletterModal } from "../contact/contact-modal-context";

type NewsletterFormData = {
  name: string;
  email: string;
};

export default function NewsletterForm() {
  const { close } = useNewsletterModal();

  const [form, setForm] = useState<NewsletterFormData>({
    name: "",
    email: "",
  });
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to subscribe");
      }

      setStatus("success");
      setForm({ name: "", email: "" });
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Something went wrong");
    }
  };

  const disabled = status === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      {/* Name */}
      <div className="grid grid-cols-3 items-center gap-3">
        <label
          htmlFor="newsletter-name"
          className="font-normal uppercase underline"
        >
          Name
        </label>
        <input
          id="newsletter-name"
          name="name"
          required
          value={form.name}
          onChange={handleChange}
          className="col-span-2 border border-neutral-300 bg-neutral-50 text-black px-3 py-2 text-sm outline-none focus:border-black"
        />
      </div>

      {/* Email */}
      <div className="grid grid-cols-3 items-center gap-3">
        <label
          htmlFor="newsletter-email"
          className="font-normal uppercase underline"
        >
          Email
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          value={form.email}
          onChange={handleChange}
          className="col-span-2 border border-neutral-300 bg-neutral-50 text-black px-3 py-2 text-sm outline-none focus:border-black"
        />
      </div>

      {status === "error" && (
        <p className="text-xs text-red-600">
          {error ?? "Error subscribing to newsletter"}
        </p>
      )}
      {status === "success" && (
        <p className="text-xs text-green-600">
          You’re in. Check your inbox for confirmation.
        </p>
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
          disabled={disabled}
          className="px-4 py-1.5 text-xs font-medium disabled:opacity-60"
        >
          {disabled ? "Subscribing..." : "Subscribe"}
        </Button>
      </div>
    </form>
  );
}
