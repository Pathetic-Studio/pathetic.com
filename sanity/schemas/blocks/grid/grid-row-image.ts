import { defineField, defineType } from "sanity";
import { LayoutGrid } from "lucide-react";
import { COLS_VARIANTS } from "../shared/layout-variants";

export default defineType({
  name: "grid-row-image",
  title: "Grid Row (Images)",
  type: "object",
  icon: LayoutGrid,
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
      title: "Color Variant",
    }),

    // Section background panel (same system as grid-row)
    defineField({
      name: "background",
      title: "Background",
      type: "background",
    }),

    // Optional feature, same as other blocks
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

    // Simple grid vs custom placement
    defineField({
      name: "gridType",
      title: "Grid type",
      type: "string",
      options: {
        list: [
          { title: "2 columns", value: "2" },
          { title: "3 columns", value: "3" },
          { title: "4 columns", value: "4" },
          { title: "Custom placement", value: "custom" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      description:
        "If a grid is chosen, items will auto-flow. Custom lets each item control its position via layout settings.",
      initialValue: "3",
    }),

    // Optional explicit gridColumns override (if you want to re-use COLS_VARIANTS)
    defineField({
      name: "gridColumns",
      title: "Grid Columns (override)",
      type: "string",
      options: {
        list: COLS_VARIANTS.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
    }),

    // Horizontal track toggle for mobile
    defineField({
      name: "mobileHorizontalTrack",
      title: "Horizontal track on mobile",
      type: "boolean",
      description:
        "If enabled, items will form a horizontal scrolling track on small screens. Desktop remains a normal grid.",
      initialValue: false,
    }),

    // Custom CSS gaps
    defineField({
      name: "rowGap",
      title: "Row gap (custom)",
      type: "string",
      description:
        "Optional custom row gap as any CSS length (e.g. 24px, 1.5rem, 3vw, clamp(1rem, 2vw, 2rem)).",
    }),
    defineField({
      name: "columnGap",
      title: "Column gap (custom)",
      type: "string",
      description:
        "Optional custom column gap as any CSS length (e.g. 24px, 1.5rem, 3vw, clamp(1rem, 2vw, 2rem)).",
    }),

    // Children
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      of: [{ type: "object-detect-image" }, { type: "image-card" }],
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
      firstItemTitle: "items.0.title",
    },
    prepare({ title, firstItemTitle }) {
      return {
        title: "Grid Row (Images)",
        subtitle: title || firstItemTitle || "No title",
      };
    },
  },
});
