// sanity/schemas/blocks/section-spacer.ts

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
      title: "Height",
      type: "string",
      description:
        "Custom height for this spacer (any valid CSS height, e.g. 4rem, 64px, 25vh, 50vh, 100vh).",
      initialValue: "4rem",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      height: "height",
    },
    prepare({ height }) {
      return {
        title: "Section Spacer",
        subtitle: height || "No height set",
      };
    },
  },
});
