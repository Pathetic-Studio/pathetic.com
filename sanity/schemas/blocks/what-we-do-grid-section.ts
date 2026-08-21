import { defineField, defineType } from "sanity";
import { Layers3 } from "lucide-react";

export default defineType({
  name: "what-we-do-grid-section",
  title: "What We Do (Layered Grid)",
  type: "object",
  icon: Layers3,
  fields: [
    defineField({
      name: "anchor",
      title: "Section Anchor",
      type: "sectionAnchor",
    }),
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "WHAT WE DO",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      initialValue:
        "We’re an idea-first, medium agnostic creative studio that makes creative, culturally impactful marketing.",
    }),
    defineField({
      name: "accentColor",
      title: "Accent colour",
      type: "color",
      initialValue: { hex: "#ff00d9" },
    }),
    defineField({
      name: "backgroundColor",
      title: "Base background colour",
      type: "color",
      initialValue: { hex: "#e7e7e2" },
    }),
    defineField({
      name: "pinDuration",
      title: "Pinned scroll length (viewports)",
      type: "number",
      description:
        "Controls the parallax lead-in and Matrix transition when this section is immediately followed by Talent Matrix.",
      initialValue: 4.2,
      validation: (rule) => rule.min(2.5).max(7),
    }),
    defineField({
      name: "layers",
      title: "Background layers",
      type: "array",
      description:
        "Layers are ordered back-to-front. Depth controls how much each layer zooms during the transition.",
      of: [
        {
          name: "whatWeDoBackgroundLayer",
          title: "Background layer",
          type: "object",
          fields: [
            defineField({
              name: "name",
              title: "Layer name",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "layerType",
              title: "Layer type",
              type: "string",
              initialValue: "image",
              options: {
                list: [
                  { title: "Image", value: "image" },
                  { title: "Transparency checker", value: "checker" },
                  { title: "City skyline", value: "city" },
                  { title: "Layered ground", value: "ground" },
                  { title: "Solid colour", value: "color" },
                  { title: "Gradient / atmosphere", value: "gradient" },
                ],
                layout: "radio",
              },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "image",
              title: "Image override",
              type: "image",
              options: { hotspot: true },
              fields: [{ name: "alt", title: "Alternative text", type: "string" }],
              hidden: ({ parent }) =>
                !["image", "city", "ground"].includes(parent?.layerType),
            }),
            defineField({
              name: "color",
              title: "Colour",
              type: "color",
              hidden: ({ parent }) =>
                !["color", "checker", "city"].includes(parent?.layerType),
            }),
            defineField({
              name: "fromColor",
              title: "Gradient start",
              type: "color",
              hidden: ({ parent }) =>
                !["gradient", "checker", "ground"].includes(parent?.layerType),
            }),
            defineField({
              name: "toColor",
              title: "Gradient end",
              type: "color",
              hidden: ({ parent }) =>
                !["gradient", "ground"].includes(parent?.layerType),
            }),
            defineField({
              name: "angle",
              title: "Gradient angle",
              type: "number",
              initialValue: 180,
              hidden: ({ parent }) => parent?.layerType !== "gradient",
            }),
            defineField({
              name: "depth",
              title: "Parallax depth",
              type: "number",
              description: "0 is distant; 1 is close to the viewer.",
              initialValue: 0.35,
              validation: (rule) => rule.min(0).max(1),
            }),
            defineField({
              name: "startScale",
              title: "Starting scale",
              type: "number",
              initialValue: 1,
              validation: (rule) => rule.min(0.5).max(2),
            }),
            defineField({
              name: "endScale",
              title: "Scale before reveal",
              type: "number",
              description: "Optional override. Otherwise depth sets the zoom amount.",
              validation: (rule) => rule.min(0.5).max(2.5),
            }),
            defineField({
              name: "xOffset",
              title: "Horizontal offset (%)",
              type: "number",
              initialValue: 0,
              validation: (rule) => rule.min(-50).max(50),
            }),
            defineField({
              name: "yOffset",
              title: "Vertical offset (%)",
              type: "number",
              initialValue: 0,
              validation: (rule) => rule.min(-50).max(50),
            }),
            defineField({
              name: "objectPosition",
              title: "Image focal position",
              type: "string",
              description: "CSS image position, for example: 50% 55%.",
              initialValue: "50% 50%",
              hidden: ({ parent }) =>
                !["image", "city", "ground"].includes(parent?.layerType),
            }),
            defineField({
              name: "opacity",
              title: "Opacity",
              type: "number",
              initialValue: 1,
              validation: (rule) => rule.min(0).max(1),
            }),
            defineField({
              name: "blendMode",
              title: "Blend mode",
              type: "string",
              initialValue: "normal",
              options: {
                list: [
                  { title: "Normal", value: "normal" },
                  { title: "Multiply", value: "multiply" },
                  { title: "Screen", value: "screen" },
                  { title: "Overlay", value: "overlay" },
                  { title: "Soft light", value: "soft-light" },
                ],
              },
            }),
          ],
          preview: {
            select: { title: "name", subtitle: "layerType", media: "image" },
          },
        },
      ],
    }),
    defineField({
      name: "services",
      title: "What we do cards",
      type: "array",
      validation: (rule) => rule.min(1).max(4),
      of: [
        {
          name: "whatWeDoService",
          title: "Service",
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({ name: "description", title: "Description", type: "text", rows: 4 }),
            defineField({
              name: "image",
              title: "Cutout image",
              type: "image",
              options: { hotspot: true },
              fields: [{ name: "alt", title: "Alternative text", type: "string" }],
            }),
            defineField({
              name: "hoverImage",
              title: "Object-detect hover image",
              type: "image",
              options: { hotspot: true },
              fields: [{ name: "alt", title: "Alternative text", type: "string" }],
              hidden: ({ parent }) => !parent?.objectDetectHover,
            }),
            defineField({
              name: "objectDetectHover",
              title: "Object-detect hover",
              type: "boolean",
              initialValue: true,
            }),
            defineField({
              name: "accentTextColor",
              title: "Accent text colour",
              type: "color",
              initialValue: { hex: "#ffffff" },
            }),
            defineField({ name: "link", title: "Optional link", type: "link" }),
            defineField({
              name: "imageScale",
              title: "Image scale",
              type: "number",
              initialValue: 1,
              validation: (rule) => rule.min(0.5).max(1.75),
            }),
            defineField({
              name: "verticalOffset",
              title: "Vertical offset (%)",
              type: "number",
              initialValue: 0,
              validation: (rule) => rule.min(-30).max(30),
            }),
          ],
          preview: { select: { title: "title", media: "image" } },
        },
      ],
    }),
    defineField({
      name: "transition",
      title: "Matrix reveal",
      type: "object",
      fields: [
        defineField({
          name: "matrixColor",
          title: "Matrix colour",
          type: "color",
          initialValue: { hex: "#00ff46" },
        }),
        defineField({
          name: "density",
          title: "Character density",
          type: "number",
          initialValue: 96,
          validation: (rule) => rule.min(48).max(180),
        }),
        defineField({
          name: "speed",
          title: "Character change speed",
          type: "number",
          initialValue: 1,
          validation: (rule) => rule.min(0.2).max(3),
        }),
        defineField({
          name: "softness",
          title: "Reveal softness",
          type: "number",
          initialValue: 0.13,
          validation: (rule) => rule.min(0.03).max(0.35),
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "heading" },
    prepare({ title }) {
      return { title: title || "What We Do", subtitle: "Layered grid → Matrix reveal" };
    },
  },
});
