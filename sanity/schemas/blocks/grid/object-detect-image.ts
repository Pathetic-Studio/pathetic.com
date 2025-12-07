// sanity/schemas/objects/object-detect-image.ts
import { defineField, defineType } from "sanity";
import { ScanSearch } from "lucide-react";

export default defineType({
  name: "object-detect-image",
  title: "Object Detect Image",
  type: "object",
  icon: ScanSearch,
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      type: "block-content",
    }),
    defineField({
      name: "accentColor",
      title: "Accent colour",
      type: "string",
      description: "CSS colour (used for borders / accents)",
    }),
    defineField({
      name: "image",
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
        },
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "link",
      type: "link",
      title: "Link",
    }),

    // Custom size controls
    defineField({
      name: "customWidth",
      title: "Custom width",
      type: "string",
      description: "Any CSS width (e.g. 320px, 50%, 20rem). If set alone, height is auto.",
    }),
    defineField({
      name: "customHeight",
      title: "Custom height",
      type: "string",
      description:
        "Any CSS height (e.g. 320px, 50vh). If set, width is auto (fills grid column).",
    }),

    // Simple layout controls for custom placement mode
    defineField({
      name: "layout",
      title: "Custom layout (optional)",
      type: "object",
      fields: [
        {
          name: "colStart",
          title: "Column start (lg)",
          type: "number",
          validation: (rule) => rule.min(1).max(4),
        },
        {
          name: "colSpan",
          title: "Column span (lg)",
          type: "number",
          validation: (rule) => rule.min(1).max(4),
        },
        {
          name: "rowSpan",
          title: "Row span (lg)",
          type: "number",
          validation: (rule) => rule.min(1).max(4),
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "image",
    },
    prepare({ title, media }) {
      return {
        title: title || "Object Detect Image",
        subtitle: "Object-detect image block",
        media,
      };
    },
  },
});
