// sanity/schemas/blocks/grid-row.ts
import { defineField, defineType } from "sanity";
import { LayoutGrid } from "lucide-react";
import { COLS_VARIANTS } from "../shared/layout-variants";

export default defineType({
  name: "grid-row",
  title: "Grid Row",
  type: "object",
  icon: LayoutGrid,
  fields: [
    defineField({
      name: "padding",
      type: "section-padding",
    }),

    // Layout behavior
    defineField({
      name: "pinToViewport",
      title: "Pin section to viewport",
      type: "boolean",
      description:
        "When enabled, this section sticks to the bottom of the viewport for 100vh so the next section scrolls over it.",
      initialValue: false,
    }),

    // Feature
    defineField({
      name: "feature",
      title: "Feature",
      type: "hero-feature",
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

    // Grid block title
    defineField({
      name: "gridTitle",
      title: "Grid title",
      type: "string",
      description:
        "Title displayed above the grid blocks, below the intro section",
    }),

    // Background panel (shared background schema)
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
        { type: "grid-post" },
        { type: "pricing-card" },
        { type: "grid-text-block" },
      ],
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
      title: "title",
      firstColumnTitle: "columns.0.title",
      firstPostTitle: "columns.0.post.title",
    },
    prepare({ title, firstColumnTitle, firstPostTitle }) {
      return {
        title: "Grid Row",
        subtitle: title || firstColumnTitle || firstPostTitle || "No Title",
      };
    },
  },
});
