// sanity/schemas/blocks/hero/hero-2.ts

import { defineField, defineType } from "sanity";
import { LayoutTemplate } from "lucide-react";

export default defineType({
  name: "hero-2",
  title: "Hero 2",
  type: "object",
  icon: LayoutTemplate,
  fields: [
    defineField({
      name: "tagLine",
      type: "string",
    }),
    defineField({
      name: "title",
      type: "string",
    }),
    defineField({
      name: "body",
      type: "block-content",
    }),
    defineField({
      name: "links",
      type: "array",
      of: [{ type: "link" }],
      validation: (rule) => rule.max(2),
    }),
    defineField({
      name: "sectionHeight",
      title: "Section Height",
      type: "string",
      options: {
        list: [
          { title: "Auto", value: "auto" },
          { title: "50vh", value: "50vh" },
          { title: "Full Height", value: "full" },
        ],
        layout: "radio",
      },
      initialValue: "auto",
    }),

    defineField({
      name: "insetBackground",
      title: "Inset Background Panel",
      type: "object",
      fields: [
        defineField({
          name: "enabled",
          title: "Enable Inset Panel",
          type: "boolean",
          initialValue: false,
        }),
        defineField({
          name: "style",
          title: "Style",
          type: "string",
          options: {
            list: [
              { title: "Solid Color", value: "solid" },
              { title: "Gradient", value: "gradient" },
            ],
            layout: "radio",
          },
          initialValue: "solid",
        }),
        defineField({
          name: "color",
          title: "Solid Color (CSS value or token)",
          type: "string",
          hidden: ({ parent }) => parent?.style !== "solid",
        }),
        defineField({
          name: "fromColor",
          title: "Gradient From Color",
          type: "string",
          hidden: ({ parent }) => parent?.style !== "gradient",
        }),
        defineField({
          name: "toColor",
          title: "Gradient To Color",
          type: "string",
          hidden: ({ parent }) => parent?.style !== "gradient",
        }),
        defineField({
          name: "angle",
          title: "Gradient Angle (degrees)",
          type: "number",
          description: "Optional. Defaults to 135° if left empty.",
          hidden: ({ parent }) => parent?.style !== "gradient",
        }),
      ],
    }),

    defineField({
      name: "feature",
      title: "Feature",
      type: "hero-feature",
    }),
  ],

  preview: {
    select: {
      title: "title",
    },
    prepare({ title }) {
      return {
        title: "Hero 2",
        subtitle: title,
      };
    },
  },
});
