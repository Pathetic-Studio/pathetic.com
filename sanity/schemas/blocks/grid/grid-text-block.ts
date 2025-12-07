import { defineField, defineType } from "sanity";
import { LayoutGrid } from "lucide-react";

export default defineType({
  name: "grid-text-block",
  title: "Grid Text Block",
  type: "object",
  icon: LayoutGrid,
  fields: [
    defineField({
      name: "titlePortable",
      title: "Title",
      type: "block-content",
      description:
        "Portable text for the title so you can control text size/styles.",
    }),
    defineField({
      name: "bodyPortable",
      title: "Body",
      type: "block-content",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
        },
      ],
    }),
    defineField({
      name: "link",
      title: "Link",
      type: "link",
    }),
    defineField({
      name: "showButton",
      title: "Show button",
      type: "boolean",
      description:
        "Turn off to keep the card clickable but hide the visible button.",
      initialValue: true,
    }),

    // EFFECT STYLE
    defineField({
      name: "effectStyle",
      title: "Effect style",
      type: "string",
      options: {
        list: [
          { title: "Normal", value: "normal" },
          { title: "Shape", value: "shape" },
          { title: "Retro button", value: "retro" },
        ],
        layout: "dropdown",
      },
      initialValue: "normal",
      description: "Choose the overall styling treatment for this block.",
    }),

    // RETRO OPTIONS
    defineField({
      name: "retroAnimate",
      title: "Animate (pressed on hover)",
      type: "boolean",
      initialValue: true,
      hidden: ({ parent }) => parent?.effectStyle !== "retro",
      description: "If on, the retro button looks pressed when hovered/clicked.",
    }),

    // SHAPE OPTIONS (for effectStyle === "shape"; border also used by normal)
    defineField({
      name: "shape",
      title: "Background shape",
      type: "string",
      options: {
        list: [
          { title: "Rectangle", value: "rectangle" },
          { title: "Oval", value: "oval" },
          { title: "Diamond", value: "diamond" },
          { title: "Circle", value: "circle" },
          { title: "Square", value: "square" },
          { title: "Star", value: "star" },
        ],
        layout: "dropdown",
      },
      initialValue: "rectangle",
      hidden: ({ parent }) => parent?.effectStyle !== "shape",
    }),
    defineField({
      name: "blurShape",
      title: "Blur background shape",
      type: "boolean",
      initialValue: false,
      hidden: ({ parent }) => parent?.effectStyle !== "shape",
    }),
    defineField({
      name: "shapeHasBorder",
      title: "Border on shape/card",
      type: "boolean",
      initialValue: true,
      description: "For Normal: border on card. For Shape: border on the shape.",
      hidden: ({ parent }) =>
        parent?.effectStyle !== "normal" && parent?.effectStyle !== "shape",
    }),

    // HOVER ANIMATION CONFIG (normal + shape only)
    defineField({
      name: "animateOnHover",
      title: "Animate on hover",
      type: "boolean",
      initialValue: true,
      hidden: ({ parent }) => parent?.effectStyle === "retro",
    }),
    defineField({
      name: "hoverBgColor",
      title: "Hover background color",
      type: "string",
      options: {
        list: [
          { title: "Primary", value: "primary" },
          { title: "Accent", value: "accent" },
          { title: "Muted", value: "muted" },
          { title: "Background", value: "background" },
        ],
        layout: "dropdown",
      },
      hidden: ({ parent }) =>
        !parent?.animateOnHover || parent?.effectStyle === "retro",
    }),
    defineField({
      name: "hoverTextColor",
      title: "Hover text color",
      type: "string",
      options: {
        list: [
          { title: "On Primary", value: "onPrimary" },
          { title: "On Accent", value: "onAccent" },
          { title: "Default (foreground)", value: "foreground" },
          { title: "Background", value: "background" },
        ],
        layout: "dropdown",
      },
      hidden: ({ parent }) =>
        !parent?.animateOnHover || parent?.effectStyle === "retro",
    }),
    defineField({
      name: "hoverScaleUp",
      title: "Scale up on hover",
      type: "boolean",
      hidden: ({ parent }) =>
        !parent?.animateOnHover || parent?.effectStyle === "retro",
    }),
  ],
  preview: {
    select: {
      media: "image",
      effectStyle: "effectStyle",
    },
    prepare({ media, effectStyle }) {
      return {
        title: "Grid Text Block",
        subtitle: effectStyle
          ? `Effect: ${effectStyle}`
          : "Portable text title & body",
        media,
      };
    },
  },
});
