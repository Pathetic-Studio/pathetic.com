import { defineField, defineType } from "sanity";

export default defineType({
  name: "display-text-style",
  title: "Display Text Style",
  type: "object",
  fields: [
    defineField({
      name: "fillColor",
      title: "Fill colour",
      type: "color",
      description: "Leave empty to inherit the section's colour variant.",
    }),
    defineField({
      name: "fontWeight",
      title: "Font weight",
      type: "string",
      options: {
        list: [
          { title: "Regular", value: "regular" },
          { title: "Medium", value: "medium" },
          { title: "Semi-bold", value: "semibold" },
          { title: "Bold", value: "bold" },
          { title: "Black", value: "black" },
        ],
        layout: "radio",
      },
      initialValue: "bold",
    }),
    defineField({
      name: "outline",
      title: "Show outline",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "outlineColor",
      title: "Outline colour",
      type: "color",
      hidden: ({ parent }) => !parent?.outline,
    }),
    defineField({
      name: "outlineWidth",
      title: "Outline width (pixels)",
      type: "number",
      initialValue: 1.5,
      validation: (rule) => rule.min(0).max(5),
      hidden: ({ parent }) => !parent?.outline,
    }),
    defineField({
      name: "outlinePosition",
      title: "Outline position",
      type: "string",
      description:
        "Outside keeps the full fill shape visible; centred splits the stroke across the glyph edge.",
      options: {
        list: [
          { title: "Outside", value: "outside" },
          { title: "Centred", value: "center" },
        ],
        layout: "radio",
      },
      initialValue: "outside",
      hidden: ({ parent }) => !parent?.outline,
    }),
  ],
});
