import { defineField, defineType } from "sanity";
import { LayoutGrid } from "lucide-react";
import { COLS_VARIANTS } from "../shared/layout-variants";

export default defineType({
  name: "grid-row-grab",
  title: "Grid Row (Grab)",
  type: "object",
  icon: LayoutGrid,
  fields: [
    defineField({ name: "padding", type: "section-padding" }),
    defineField({
      name: "colorVariant",
      type: "color-variant",
      title: "Color Variant",
    }),
    defineField({
      name: "background",
      title: "Background",
      type: "background",
    }),
    defineField({
      name: "feature",
      title: "Feature",
      type: "hero-feature",
    }),
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
    defineField({
      name: "gridColumns",
      title: "Grid Columns (override)",
      type: "string",
      options: {
        list: COLS_VARIANTS.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
    }),
    defineField({
      name: "mobileHorizontalTrack",
      title: "Horizontal track on mobile",
      type: "boolean",
      description:
        "If enabled, items will form a horizontal scrolling track on small screens. Desktop remains a normal grid.",
      initialValue: false,
    }),
    defineField({
      name: "rowGap",
      title: "Row gap (custom)",
      type: "string",
    }),
    defineField({
      name: "columnGap",
      title: "Column gap (custom)",
      type: "string",
    }),
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      of: [{ type: "object-detect-image" }, { type: "image-card" }],
    }),
  ],
  preview: {
    select: {
      title: "title",
      firstItemTitle: "items.0.title",
    },
    prepare({ title, firstItemTitle }) {
      return {
        title: "Grid Row (Grab)",
        subtitle: title || firstItemTitle || "No title",
      };
    },
  },
});
