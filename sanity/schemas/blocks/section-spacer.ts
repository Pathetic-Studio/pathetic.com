import { defineField, defineType } from "sanity";
import { Minus } from "lucide-react";

export default defineType({
  name: "section-spacer",
  title: "Section Spacer",
  type: "object",
  icon: Minus,
  fields: [
    defineField({
      name: "height",
      title: "Height (Desktop)",
      type: "string",
      description:
        "Desktop height (any valid CSS height: 4rem, 64px, 25vh, etc).",
      initialValue: "4rem",
    }),
    defineField({
      name: "heightTablet",
      title: "Height (Tablet)",
      type: "string",
      description:
        "Optional. Overrides height at 768px and below (e.g. 3rem). Leave blank to use Desktop height.",
      // optional by default — no validation needed
    }),
    defineField({
      name: "heightMobile",
      title: "Height (Mobile)",
      type: "string",
      description:
        "Optional. Overrides height at 640px and below (e.g. 2rem). Leave blank to use Tablet (if set) or Desktop.",
      // optional by default — no validation needed
    }),
  ],
  preview: {
    select: {
      height: "height",
      heightTablet: "heightTablet",
      heightMobile: "heightMobile",
    },
    prepare({ height, heightTablet, heightMobile }) {
      const d = (height || "").trim() || "—";
      const t = (heightTablet || "").trim();
      const m = (heightMobile || "").trim();

      const parts = [`D: ${d}`];
      if (t) parts.push(`T: ${t}`);
      if (m) parts.push(`M: ${m}`);

      return {
        title: "Section Spacer",
        subtitle: parts.join(" • "),
      };
    },
  },
});
