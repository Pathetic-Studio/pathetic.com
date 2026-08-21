import { defineField, defineType } from "sanity";
import { Network } from "lucide-react";

export default defineType({
  name: "talent-matrix-section",
  title: "Talent Matrix",
  type: "object",
  icon: Network,
  fields: [
    defineField({ name: "anchor", title: "Section Anchor", type: "sectionAnchor" }),
    defineField({
      name: "eyebrow",
      title: "Top line",
      type: "string",
      initialValue: "WE DO THIS WITH OUR",
    }),
    defineField({
      name: "accentWord",
      title: "Middle line",
      type: "string",
      initialValue: "PATHETIC",
    }),
    defineField({
      name: "title",
      title: "Main title",
      type: "string",
      initialValue: "TALENT\nMATRIX",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      initialValue:
        "We are building a network of the world’s best creatives and creators to bring new ideas to life.",
    }),
    defineField({ name: "cta", title: "Call to action", type: "link" }),
    defineField({
      name: "sceneColor",
      title: "Scene colour",
      type: "color",
      initialValue: { hex: "#00ff46" },
    }),
    defineField({
      name: "backgroundColor",
      title: "Scene background",
      type: "color",
      initialValue: { hex: "#000600" },
    }),
    defineField({
      name: "cityDensity",
      title: "City density",
      type: "number",
      initialValue: 30,
      validation: (rule) => rule.min(12).max(54),
    }),
    defineField({
      name: "talents",
      title: "Talent roles",
      type: "array",
      validation: (rule) => rule.min(1).max(6),
      of: [
        {
          name: "talentMatrixRole",
          title: "Talent role",
          type: "object",
          fields: [
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "image",
              title: "Optional character cutout",
              type: "image",
              options: { hotspot: true },
              fields: [{ name: "alt", title: "Alternative text", type: "string" }],
            }),
          ],
          preview: { select: { title: "label", media: "image" } },
        },
      ],
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return { title: title?.replace?.("\n", " ") || "Talent Matrix", subtitle: "Three.js New York scene" };
    },
  },
});
