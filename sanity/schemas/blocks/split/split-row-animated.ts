// sanity/schemas/blocks/split/split-row-animated.ts
import { defineType, defineField } from "sanity";
import { SquareSplitHorizontal } from "lucide-react";

export default defineType({
  name: "split-row-animated",
  type: "object",
  title: "Split Row (Animated)",
  description:
    "Animated split row: sticky intro + animated cards on the right, with optional synced image.",
  icon: SquareSplitHorizontal,
  fields: [
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

    // Intro content
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
      name: "animateText",
      title: "Animate title text",
      type: "boolean",
      description: "Type-on animation for the section title when in view.",
      initialValue: false,
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

    // NEW: sticky header toggle
    defineField({
      name: "stickyIntro",
      title: "Stick intro while cards scroll",
      type: "boolean",
      description:
        "If enabled, the intro/header sticks to the top on large screens while the right column scrolls.",
      initialValue: false,
    }),

    defineField({
      name: "splitColumns",
      type: "array",
      of: [
        { type: "split-content" },
        { type: "split-cards-list-animated" }, // NEW animated list
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
      mainTitle: "title",
    },
    prepare({ title0, title1, mainTitle }) {
      return {
        title: "Split Row (Animated)",
        subtitle: mainTitle || title0 || title1 || "No Title",
      };
    },
  },
});
