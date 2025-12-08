// sanity/schemas/blocks/split/split-row.ts
import { defineType, defineField } from "sanity";
import { SquareSplitHorizontal } from "lucide-react";

export default defineType({
  name: "split-row",
  type: "object",
  title: "Split Row",
  description:
    "Split Row: Customizable split row with multiple columns variants",
  icon: SquareSplitHorizontal,
  fields: [
    defineField({
      name: "anchor",
      title: "Section Anchor",
      type: "sectionAnchor",
      description:
        "Optional anchor ID for in-page navigation (used by anchor links in the nav).",
    }),
    defineField({
      name: "padding",
      type: "section-padding",
    }),
    defineField({
      name: "colorVariant",
      type: "color-variant",
      description: "Select a background color variant",
    }),
    defineField({
      name: "noGap",
      type: "boolean",
      description: "Remove gap between columns",
      initialValue: false,
    }),

    // intro “hero-style” content
    defineField({
      name: "tagLine",
      title: "Tag line",
      type: "string",
    }),
    defineField({
      name: "title",
      title: "Section title",
      type: "string",
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "block-content",
    }),
    defineField({
      name: "links",
      title: "Links",
      type: "array",
      of: [{ type: "link" }],
      validation: (rule) => rule.max(2),
    }),
    defineField({
      name: "introPadding",
      title: "Intro padding (top & bottom)",
      type: "string",
      options: {
        list: [
          { title: "None", value: "none" },
          { title: "Small", value: "sm" },
          { title: "Medium", value: "md" },
          { title: "Large", value: "lg" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "md",
    }),

    defineField({
      name: "splitColumns",
      type: "array",
      of: [
        { type: "split-content" },
        { type: "split-cards-list" },
        { type: "split-image" },
        { type: "split-image-animate" },
        { type: "split-info-list" },
      ],
      validation: (rule) => rule.max(2),
      options: {
        insertMenu: {
          views: [
            {
              name: "grid",
              previewImageUrl: (block) => `/sanity/preview/${block}.jpg`,
            },
            { name: "list" },
          ],
        },
      },
    }),
  ],
  preview: {
    select: {
      title0: "splitColumns.0.title",
      title1: "splitColumns.1.title",
    },
    prepare({ title0, title1 }) {
      return {
        title: "Split Row",
        subtitle: title0 || title1 || "No Title",
      };
    },
  },
});
