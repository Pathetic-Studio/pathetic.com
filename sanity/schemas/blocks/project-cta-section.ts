import { defineField, defineType } from "sanity";
import { Sparkles } from "lucide-react";

export default defineType({
  name: "project-cta-section",
  title: "Project CTA",
  type: "object",
  icon: Sparkles,
  initialValue: {
    title: "WORK WITH US",
    buttonLabel: "START A PROJECT",
    panelColor: { hex: "#93A7FF" },
    textColor: { hex: "#FFFFFF" },
    outlineColor: { hex: "#050505" },
    accentColor: { hex: "#FF241A" },
    sparklesEnabled: true,
  },
  fields: [
    defineField({ name: "anchor", title: "Section Anchor", type: "sectionAnchor" }),
    defineField({
      name: "title",
      title: "Large copy",
      type: "string",
      validation: (rule) => rule.required().max(56),
    }),
    defineField({
      name: "buttonLabel",
      title: "Small button copy",
      type: "string",
      validation: (rule) => rule.required().max(48),
    }),
    defineField({ name: "panelColor", title: "Panel colour", type: "color" }),
    defineField({ name: "textColor", title: "Text colour", type: "color" }),
    defineField({ name: "outlineColor", title: "Text outline colour", type: "color" }),
    defineField({ name: "accentColor", title: "Triangle and sparkle colour", type: "color" }),
    defineField({
      name: "backgroundImage",
      title: "Optional panel background image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Alternative text", type: "string" }),
      ],
    }),
    defineField({
      name: "sparklesEnabled",
      title: "Pointer sparkles",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return { title: "Project CTA", subtitle: title || "WORK WITH US", media: Sparkles };
    },
  },
});
