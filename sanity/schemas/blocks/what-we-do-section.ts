import { defineField, defineType } from "sanity";
import { MousePointer2 } from "lucide-react";

const imageWithAlt = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: "image",
    options: { hotspot: true },
    fields: [
      defineField({
        name: "alt",
        title: "Alternative text",
        type: "string",
      }),
    ],
  });

export default defineType({
  name: "what-we-do-section",
  title: "What We Do",
  type: "object",
  icon: MousePointer2,
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
    }),
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "And we make things like this",
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: "items",
      title: "Floating projects",
      type: "array",
      validation: (rule) => rule.max(10),
      of: [
        defineField({
          name: "floatingProject",
          title: "Floating project",
          type: "object",
          fields: [
            defineField({
              name: "project",
              title: "Case study page",
              type: "reference",
              to: [{ type: "page" }, { type: "post" }],
              description:
                "Add this before launch. Items without a page remain visible as local layout placeholders.",
            }),
            defineField({
              name: "titleOverride",
              title: "Title override",
              description: "Leave empty to use the referenced page title.",
              type: "string",
            }),
            defineField({
              name: "mediaType",
              title: "Media type",
              type: "string",
              options: {
                list: [
                  { title: "Image", value: "image" },
                  { title: "Video", value: "video" },
                ],
                layout: "radio",
              },
              initialValue: "image",
            }),
            imageWithAlt("image", "Image override"),
            defineField({
              name: "video",
              title: "Video",
              type: "file",
              options: { accept: "video/mp4,video/webm,.mp4,.webm" },
              hidden: ({ parent }) => parent?.mediaType !== "video",
            }),
            imageWithAlt("videoPoster", "Video poster"),
            defineField({
              name: "mediaFit",
              title: "Media fit",
              type: "string",
              options: {
                list: [
                  { title: "Contain", value: "contain" },
                  { title: "Cover", value: "cover" },
                ],
                layout: "radio",
              },
              initialValue: "contain",
            }),
            defineField({
              name: "positionX",
              title: "Desktop X position (%)",
              type: "number",
              validation: (rule) => rule.min(5).max(95),
            }),
            defineField({
              name: "positionY",
              title: "Desktop Y position (%)",
              type: "number",
              validation: (rule) => rule.min(8).max(88),
            }),
            defineField({
              name: "width",
              title: "Desktop width (%)",
              type: "number",
              initialValue: 13,
              validation: (rule) => rule.min(6).max(28),
            }),
            defineField({
              name: "mobilePositionX",
              title: "Mobile X position (%)",
              type: "number",
              validation: (rule) => rule.min(8).max(92),
            }),
            defineField({
              name: "mobilePositionY",
              title: "Mobile Y position (%)",
              type: "number",
              validation: (rule) => rule.min(8).max(90),
            }),
            defineField({
              name: "mobileWidth",
              title: "Mobile width (%)",
              type: "number",
              initialValue: 28,
              validation: (rule) => rule.min(18).max(48),
            }),
            defineField({
              name: "floatAmount",
              title: "Float distance (pixels)",
              type: "number",
              initialValue: 12,
              validation: (rule) => rule.min(0).max(40),
            }),
            defineField({
              name: "floatDuration",
              title: "Float duration (seconds)",
              type: "number",
              initialValue: 5,
              validation: (rule) => rule.min(2).max(14),
            }),
          ],
          preview: {
            select: {
              title: "titleOverride",
              projectTitle: "project.title",
              media: "image",
            },
            prepare({ title, projectTitle, media }) {
              return {
                title: title || projectTitle || "Floating project",
                media,
              };
            },
          },
        }),
      ],
    }),
    defineField({
      name: "figure",
      title: "Interactive pointing figure",
      type: "object",
      fields: [
        imageWithAlt("personImage", "Person cutout"),
        imageWithAlt("armImage", "Stretching arm texture"),
        imageWithAlt("handImage", "Pointing hand cutout"),
        defineField({
          name: "personWidth",
          title: "Person width (%)",
          type: "number",
          initialValue: 9,
          validation: (rule) => rule.min(5).max(22),
        }),
        defineField({
          name: "personX",
          title: "Person X position (%)",
          type: "number",
          initialValue: 88,
          validation: (rule) => rule.min(55).max(96),
        }),
        defineField({
          name: "shoulderX",
          title: "Arm origin X (%)",
          type: "number",
          initialValue: 88,
          validation: (rule) => rule.min(50).max(98),
        }),
        defineField({
          name: "shoulderY",
          title: "Arm origin Y (%)",
          type: "number",
          initialValue: 76,
          validation: (rule) => rule.min(45).max(95),
        }),
        defineField({
          name: "handWidth",
          title: "Hand width (pixels)",
          type: "number",
          initialValue: 110,
          validation: (rule) => rule.min(50).max(220),
        }),
        defineField({
          name: "handTipX",
          title: "Fingertip X position (%)",
          description: "Horizontal anchor point that sits directly on the cursor.",
          type: "number",
          initialValue: 12,
          validation: (rule) => rule.min(0).max(100),
        }),
        defineField({
          name: "handTipY",
          title: "Fingertip Y position (%)",
          description: "Vertical anchor point that sits directly on the cursor.",
          type: "number",
          initialValue: 27,
          validation: (rule) => rule.min(0).max(100),
        }),
        defineField({
          name: "handWristX",
          title: "Wrist X position (%)",
          description: "Horizontal point where the stretching arm meets the hand.",
          type: "number",
          initialValue: 82,
          validation: (rule) => rule.min(0).max(100),
        }),
        defineField({
          name: "handWristY",
          title: "Wrist Y position (%)",
          description: "Vertical point where the stretching arm meets the hand.",
          type: "number",
          initialValue: 79,
          validation: (rule) => rule.min(0).max(100),
        }),
        defineField({
          name: "handRotationOffset",
          title: "Hand rotation correction (degrees)",
          type: "number",
          initialValue: 0,
          validation: (rule) => rule.min(-180).max(180),
        }),
        defineField({
          name: "armColor",
          title: "Arm colour",
          type: "string",
          initialValue: "#2d2d2d",
          description: "Any valid CSS colour.",
        }),
        defineField({
          name: "armWidth",
          title: "Arm width at hand (pixels)",
          type: "number",
          initialValue: 34,
          validation: (rule) => rule.min(12).max(80),
        }),
      ],
    }),
  ],
  preview: {
    select: { subtitle: "heading" },
    prepare({ subtitle }) {
      return {
        title: "What We Do",
        subtitle: subtitle || "Floating linked projects",
      };
    },
  },
});
