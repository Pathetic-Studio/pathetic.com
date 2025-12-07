// sanity/schemas/objects/inset-background.ts

import { defineField, defineType } from "sanity";
import { PanelsTopLeft } from "lucide-react";

export default defineType({
  name: "inset-background",
  title: "Inset Background",
  type: "object",
  icon: PanelsTopLeft,
  fields: [
    defineField({
      name: "enabled",
      title: "Enable",
      type: "boolean",
      initialValue: false,
    }),

    defineField({
      name: "behavior",
      title: "Behavior",
      type: "string",
      options: {
        list: [
          { title: "Full height", value: "full" },
          { title: "Sticky", value: "sticky" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "full",
    }),

    defineField({
      name: "width",
      title: "Width preset",
      type: "string",
      options: {
        list: [
          { title: "Inset", value: "inset" },
          { title: "Full bleed", value: "full" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "inset",
    }),

    defineField({
      name: "height",
      title: "Height preset",
      type: "string",
      options: {
        list: [
          { title: "Auto", value: "auto" },
          { title: "Full section", value: "full" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "auto",
    }),

    defineField({
      name: "customWidth",
      title: "Custom width",
      type: "string",
      description:
        "Optional CSS width (e.g. 60%, 40rem). Overrides preset when set.",
    }),

    defineField({
      name: "customHeight",
      title: "Custom height",
      type: "string",
      description:
        "Optional CSS height (e.g. 60vh, 30rem). Overrides preset when set.",
    }),

    // NEW: control vertical placement mode
    defineField({
      name: "placementMode",
      title: "Vertical placement",
      type: "string",
      options: {
        list: [
          { title: "Preset", value: "preset" },
          { title: "Custom top offset (%)", value: "custom" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "preset",
    }),

    // NEW: custom top offset percentage
    defineField({
      name: "verticalOffsetPercent",
      title: "Top offset (%)",
      type: "number",
      description:
        "Distance from top of section to top of inset box. 0% = very top.",
      validation: (rule) => rule.min(-50).max(200),
      hidden: ({ parent }) => parent?.placementMode !== "custom",
    }),

    defineField({
      name: "position",
      title: "Horizontal position",
      type: "string",
      options: {
        list: [
          { title: "Center", value: "center" },
          { title: "Left", value: "left" },
          { title: "Right", value: "right" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "center",
    }),

    defineField({
      name: "border",
      title: "Show border",
      type: "boolean",
      initialValue: true,
    }),

    defineField({
      name: "style",
      title: "Background style",
      type: "string",
      options: {
        list: [
          { title: "Image", value: "image" },
          { title: "Solid colour", value: "solid" },
          { title: "Gradient", value: "gradient" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "image",
    }),

    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          title: "Alt text",
          type: "string",
        },
      ],
      hidden: ({ parent }) => parent?.style !== "image",
    }),

    defineField({
      name: "color",
      title: "Colour",
      type: "string",
      hidden: ({ parent }) => parent?.style !== "solid",
    }),

    defineField({
      name: "fromColor",
      title: "Gradient from",
      type: "string",
      hidden: ({ parent }) => parent?.style !== "gradient",
    }),

    defineField({
      name: "toColor",
      title: "Gradient to",
      type: "string",
      hidden: ({ parent }) => parent?.style !== "gradient",
    }),

    defineField({
      name: "angle",
      title: "Gradient angle (deg)",
      type: "number",
      initialValue: 135,
      hidden: ({ parent }) => parent?.style !== "gradient",
    }),
  ],
});
