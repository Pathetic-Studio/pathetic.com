// schemas/objects/hero-feature.ts (or wherever it lives)
import { defineField, defineType } from "sanity";

export default defineType({
  name: "hero-feature",
  title: "Hero Feature",
  type: "object",
  fields: [
    defineField({
      name: "type",
      title: "Feature type",
      type: "string",
      options: {
        list: [
          { title: "None", value: "none" },
          { title: "Mouse trail", value: "mouseTrail" },
          { title: "Rotating images", value: "rotatingImages" },
          { title: "Eye follow", value: "eyeFollow" },
          { title: "Image explode", value: "imageExplode" },
        ],
        layout: "radio",
      },
      initialValue: "none",
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "images",
      title: "Feature images",
      type: "array",
      of: [{ type: "image" }],
      hidden: ({ parent }) =>
        parent?.type === "none" ||
        parent?.type === "eyeFollow" ||
        !parent?.type,
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { type?: string } | undefined;
          const needsImages =
            parent?.type === "mouseTrail" ||
            parent?.type === "rotatingImages" ||
            parent?.type === "imageExplode";

          if (needsImages && (!value || value.length === 0)) {
            return "Add at least one image for this feature.";
          }

          return true;
        }),
    }),

    defineField({
      name: "eyes",
      title: "Eyes",
      type: "array",
      of: [
        defineField({
          name: "eye",
          type: "object",
          fields: [
            defineField({
              name: "x",
              title: "X position (%)",
              type: "number",
              validation: (rule) => rule.min(0).max(100),
            }),
            defineField({
              name: "y",
              title: "Y position (%)",
              type: "number",
              validation: (rule) => rule.min(0).max(100),
            }),
            defineField({
              name: "size",
              title: "Eye size (px)",
              type: "number",
              description: "Optional. Default is ~72px.",
            }),
          ],
        }),
      ],
      hidden: ({ parent }) => parent?.type !== "eyeFollow",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { type?: string } | undefined;
          if (parent?.type === "eyeFollow" && (!value || value.length === 0)) {
            return "Add at least one eye.";
          }
          return true;
        }),
    }),

    // NEW: boolean to enable click-to-add eyes
    defineField({
      name: "enableClickToAddEyes",
      title: "Allow adding eyes by clicking",
      type: "boolean",
      description: "When enabled, clicking the section will spawn extra eyes.",
      initialValue: false,
      hidden: ({ parent }) => parent?.type !== "eyeFollow",
    }),
  ],
  preview: {
    select: {
      type: "type",
    },
    prepare({ type }) {
      let subtitle = "No feature";

      if (type === "mouseTrail") subtitle = "Mouse trail";
      else if (type === "rotatingImages") subtitle = "Rotating images";
      else if (type === "eyeFollow") subtitle = "Eye follow";
      else if (type === "imageExplode") subtitle = "Image explode";

      return {
        title: "Hero Feature",
        subtitle,
      };
    },
  },
});
