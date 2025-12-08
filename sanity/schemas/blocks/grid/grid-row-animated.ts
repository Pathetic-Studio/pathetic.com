// sanity/schemas/blocks/grid-row-animated.ts
import { defineField, defineType } from "sanity";
import { LayoutGrid } from "lucide-react";
import { COLS_VARIANTS } from "../shared/layout-variants";

export default defineType({
  name: "grid-row-animated",
  title: "Grid Row (Animated)",
  type: "object",
  icon: LayoutGrid,
  fields: [
    defineField({ name: "padding", type: "section-padding" }),
    defineField({ name: "colorVariant", type: "color-variant" }),

    // Intro content
    defineField({ name: "tagLine", title: "Tag line", type: "string" }),
    defineField({ name: "title", title: "Section title", type: "string" }),
    defineField({ name: "body", title: "Body", type: "block-content" }),
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

    // Grid block title
    defineField({
      name: "gridTitle",
      title: "Grid title",
      type: "string",
    }),

    // Background (shared background schema with layout + border)
    defineField({
      name: "background",
      title: "Background",
      type: "background",
    }),

    // Custom grid container padding overrides
    defineField({
      name: "gridPaddingTop",
      title: "Grid padding top",
      type: "string",
      description:
        "Custom top padding for the grid container (e.g. 0, 2rem, 24px). Overrides the default p-12 top if set.",
    }),
    defineField({
      name: "gridPaddingBottom",
      title: "Grid padding bottom",
      type: "string",
      description:
        "Custom bottom padding for the grid container (e.g. 0, 2rem, 24px). Overrides the default p-12 bottom if set.",
    }),
    defineField({
      name: "gridPaddingLeft",
      title: "Grid padding left",
      type: "string",
      description:
        "Custom left padding for the grid container (e.g. 0, 2rem, 24px). Overrides the default p-12 left if set.",
    }),
    defineField({
      name: "gridPaddingRight",
      title: "Grid padding right",
      type: "string",
      description:
        "Custom right padding for the grid container (e.g. 0, 2rem, 24px). Overrides the default p-12 right if set.",
    }),

    // Custom row/column gap overrides
    defineField({
      name: "gridRowGap",
      title: "Grid row spacing",
      type: "string",
      description:
        "Custom row gap for the grid (e.g. 1rem, 24px). Overrides the Tailwind gap-6 row gap if set.",
    }),
    defineField({
      name: "gridColumnGap",
      title: "Grid column spacing",
      type: "string",
      description:
        "Custom column gap for the grid (e.g. 1rem, 24px). Overrides the Tailwind gap-6 column gap if set.",
    }),

    defineField({
      name: "gridColumns",
      type: "string",
      title: "Grid Columns",
      options: {
        list: COLS_VARIANTS.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
      initialValue: "grid-cols-3",
    }),

    defineField({
      name: "columns",
      type: "array",
      of: [
        { type: "grid-card" },
        { type: "grid-card-animated" },
        { type: "grid-post" },
        { type: "pricing-card" },
        { type: "grid-text-block" },
      ],
    }),

    // Optional animation controls (still available if you want to hook them up)
    defineField({
      name: "animation",
      title: "Animation settings",
      type: "object",
      fields: [
        { name: "stagger", type: "number", initialValue: 0.18 },
        { name: "duration", type: "number", initialValue: 0.7 },
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      firstColumnTitle: "columns.0.title",
      firstPostTitle: "columns.0.post.title",
    },
    prepare({ title, firstColumnTitle, firstPostTitle }) {
      return {
        title: "Grid Row (Animated)",
        subtitle: title || firstColumnTitle || firstPostTitle || "No Title",
      };
    },
  },
});
