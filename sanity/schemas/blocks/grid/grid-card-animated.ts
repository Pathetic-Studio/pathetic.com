// sanity/schemas/blocks/grid/grid-card-aniamted.ts
import { defineField, defineType } from "sanity";
import { LayoutGrid } from "lucide-react";

export default defineType({
  name: "grid-card-animated",
  type: "object",
  icon: LayoutGrid,
  fields: [
    defineField({
      name: "title",
      type: "string",
    }),
    defineField({
      name: "excerpt",
      type: "text",
    }),
    defineField({
      name: "image",
      type: "image",
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
        },
      ],
    }),
    defineField({
      name: "link",
      type: "link",
    }),
    defineField({
      name: "caption",
      title: "Floating caption bubble",
      type: "object",
      fields: [
        defineField({
          name: "text",
          title: "Text",
          type: "string",
        }),
        defineField({
          name: "bgColor",
          title: "Background color (CSS value)",
          type: "string",
          description: "Any valid CSS color, e.g. #000, rgb(), var(--token)",
        }),
        defineField({
          name: "textColor",
          title: "Text color (CSS value)",
          type: "string",
        }),
        defineField({
          name: "side",
          title: "Bubble side",
          type: "string",
          options: {
            list: [
              { title: "Right", value: "right" },
              { title: "Left", value: "left" },
            ],
            layout: "radio",
            direction: "horizontal",
          },
          initialValue: "right",
        }),
        defineField({
          name: "xPercent",
          title: "X position (%)",
          type: "number",
          description: "0–100 across the image (left to right)",
        }),
        defineField({
          name: "yPercent",
          title: "Y position (%)",
          type: "number",
          description: "0–100 down the image (top to bottom)",
        }),
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
        title: "Grid Card (Animated)",
        subtitle: title || "No title",
        media,
      };
    },
  },
});
