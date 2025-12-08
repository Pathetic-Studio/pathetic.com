// sanity/schemas/shared/section-anchor.ts
import { defineField, defineType } from "sanity";

export default defineType({
  name: "sectionAnchor",
  title: "Section Anchor",
  type: "object",
  fields: [
    defineField({
      name: "anchorId",
      title: "Anchor ID",
      type: "string",
      description:
        "ID used for in-page navigation. No spaces, no # (e.g. hero, services, work).",
      validation: (Rule) => Rule.regex(/^[A-Za-z0-9\-_]+$/).warning(
        "Use only letters, numbers, hyphens, and underscores."
      ),
    }),
    defineField({
      name: "defaultOffsetPercent",
      title: "Default offset (%)",
      type: "number",
      description:
        "Optional default Y offset (0–100) for this section. Only used if your code decides to read it.",
      validation: (Rule) => Rule.min(0).max(100),
    }),
  ],
  preview: {
    select: {
      anchorId: "anchorId",
      defaultOffsetPercent: "defaultOffsetPercent",
    },
    prepare({ anchorId, defaultOffsetPercent }) {
      return {
        title: anchorId || "No anchor ID",
        subtitle:
          typeof defaultOffsetPercent === "number"
            ? `Offset: ${defaultOffsetPercent}%`
            : "No default offset",
      };
    },
  },
});
