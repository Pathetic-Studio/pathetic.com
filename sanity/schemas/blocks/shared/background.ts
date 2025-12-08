import { defineField, defineType } from "sanity";

export default defineType({
  name: "background",
  title: "Background",
  type: "object",
  fields: [
    defineField({
      name: "enabled",
      title: "Enable Background",
      type: "boolean",
      initialValue: false,
    }),

    defineField({
      name: "layout",
      title: "Layout",
      type: "string",
      options: {
        list: [
          { title: "Inset Panel", value: "inset" },
          { title: "Full Bleed", value: "full" },
        ],
        layout: "radio",
      },
      initialValue: "inset",
    }),

    defineField({
      name: "border",
      title: "Show Border",
      type: "boolean",
      initialValue: true,
    }),

    defineField({
      name: "style",
      title: "Style",
      type: "string",
      options: {
        list: [
          { title: "Solid Color", value: "solid" },
          { title: "Gradient", value: "gradient" },
          { title: "Image", value: "image" },
        ],
        layout: "radio",
      },
      initialValue: "solid",
    }),

    // Solid
    defineField({
      name: "color",
      title: "Solid Color (CSS value or token)",
      type: "string",
      hidden: ({ parent }) => parent?.style !== "solid",
    }),

    // Gradient
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

    // Image
    defineField({
      name: "image",
      title: "Background Image",
      type: "image",
      options: {
        hotspot: true,
      },
      hidden: ({ parent }) => parent?.style !== "image",
    }),

    // Custom sizing / Y-position for inset layout
    defineField({
      name: "customHeight",
      title: "Panel Height (CSS)",
      type: "string",
      description:
        "Optional custom height for the background panel (e.g. 60vh, 480px, clamp(20rem, 40vh, 30rem)). Only applies to inset layout.",
      hidden: ({ parent }) => parent?.layout !== "inset",
    }),
    defineField({
      name: "verticalOffsetPercent",
      title: "Vertical Offset (%)",
      type: "number",
      description:
        "Top offset of the inset panel as a percentage of the section height (0 = very top, 100 = very bottom). Only applies to inset layout.",
      validation: (rule) => rule.min(0).max(100),
      hidden: ({ parent }) => parent?.layout !== "inset",
    }),
  ],
});
