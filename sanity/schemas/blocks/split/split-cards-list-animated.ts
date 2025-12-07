// sanity/schemas/blocks/split/split-cards-list-animated.ts
import { defineField, defineType } from "sanity";
import { TextQuote } from "lucide-react";

export default defineType({
  name: "split-cards-list-animated",
  type: "object",
  icon: TextQuote,
  title: "Split Cards List (Animated)",
  description:
    "Cards list that can fade in from the right and sync with an image track.",
  fields: [
    defineField({
      name: "animateInRight",
      title: "Animate in from right",
      type: "boolean",
      description:
        "If enabled, cards fade in from the right using GSAP ScrollTrigger.",
      initialValue: true,
    }),
    defineField({
      name: "list",
      type: "array",
      of: [{ type: "split-card" }], // reuse existing split-card
    }),
  ],
  preview: {
    select: {
      title: "list.0.title",
    },
    prepare({ title }) {
      return {
        title: title || "Animated cards list",
      };
    },
  },
});
