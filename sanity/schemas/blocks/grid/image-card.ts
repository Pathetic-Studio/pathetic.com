import { defineField, defineType } from "sanity";
import { Image as ImageIcon } from "lucide-react";

export default defineType({
  name: "image-card",
  title: "Image Card",
  type: "object",
  icon: ImageIcon,
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
    }),

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
        title: title || "Image Card",
        subtitle: "Image card",
        media,
      };
    },
  },
});
