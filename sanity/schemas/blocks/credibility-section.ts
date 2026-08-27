import { defineField, defineType } from "sanity";
import { BadgeCheck } from "lucide-react";

function logoArray(name: "leftLogos" | "rightLogos", title: string) {
  return defineField({
    name,
    title,
    type: "array",
    validation: (rule) => rule.max(14),
    of: [
      defineField({
        name: "logo",
        title: "Logo",
        type: "image",
        options: { hotspot: true },
        fields: [
          defineField({
            name: "alt",
            title: "Brand name / alternative text",
            type: "string",
            validation: (rule) => rule.required(),
          }),
        ],
      }),
    ],
  });
}

export default defineType({
  name: "credibility-section",
  title: "Credibility Logo Blobs",
  type: "object",
  icon: BadgeCheck,
  fields: [
    defineField({
      name: "anchor",
      title: "Section Anchor",
      type: "sectionAnchor",
    }),
    defineField({ name: "padding", type: "section-padding" }),
    defineField({ name: "colorVariant", type: "color-variant" }),
    defineField({
      name: "background",
      title: "Background treatment",
      type: "background",
      description:
        "Optional solid, gradient or image layer. The colour variant still controls the text and fallback surface.",
    }),
    defineField({
      name: "displayTextStyle",
      title: "Title style",
      type: "display-text-style",
    }),
    defineField({
      name: "title",
      title: "Central title",
      type: "text",
      rows: 7,
      initialValue:
        "FROM STARTUPS\nDISRUPTING\nINCUMBENTS\nTO\nCATEGORY LEADERS\nDISRUPTING\nTHEMSELVES.",
      validation: (rule) => rule.required().max(260),
    }),
    logoArray("leftLogos", "Left logo blob"),
    logoArray("rightLogos", "Right logo blob"),
    defineField({
      name: "rotationDuration",
      title: "Blob rotation duration (seconds)",
      type: "number",
      initialValue: 32,
      validation: (rule) => rule.min(10).max(90),
    }),
  ],
  preview: {
    select: { subtitle: "title" },
    prepare({ subtitle }) {
      return {
        title: "Credibility Logo Blobs",
        subtitle: subtitle || "Two animated 3D logo clusters",
      };
    },
  },
});
