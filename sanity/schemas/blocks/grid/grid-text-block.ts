// sanity/schemas/blocks/grid-text-block.ts
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
        ],
        layout: "dropdown",
      },
      initialValue: "normal",
      description: "Choose the overall styling treatment for this block.",
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

    // BEVEL
    defineField({
      name: "bevel",
      title: "Bevel edges",
      type: "boolean",
      initialValue: false,
      description: "Adds a subtle beveled edge effect to the block.",
      hidden: ({ parent }) =>
        parent?.effectStyle !== "normal" && parent?.effectStyle !== "shape",
    }),

    // BASE COLOUR SCHEME
    defineField({
      name: "colorScheme",
      title: "Color scheme",
      type: "string",
      options: {
        list: [
          {
            title: "Default (bg: background, text: foreground)",
            value: "default",
          },
          {
            title: "Inverted (bg: foreground, text: background)",
            value: "inverted",
          },
          {
            title: "Custom",
            value: "custom",
          },
        ],
        layout: "dropdown",
      },
      initialValue: "default",
      hidden: ({ parent }) =>
        parent?.effectStyle !== "normal" && parent?.effectStyle !== "shape",
    }),
    defineField({
      name: "colorBgCustomToken",
      title: "Custom background colour",
      type: "string",
      options: {
        list: [
          { title: "Background", value: "background" },
          { title: "Foreground", value: "foreground" },
          { title: "Primary", value: "primary" },
          { title: "Accent", value: "accent" },
          { title: "Muted", value: "muted" },
        ],
        layout: "dropdown",
      },
      hidden: ({ parent }) =>
        parent?.colorScheme !== "custom" ||
        (parent?.effectStyle !== "normal" && parent?.effectStyle !== "shape"),
    }),
    defineField({
      name: "colorTextCustomToken",
      title: "Custom text colour",
      type: "string",
      options: {
        list: [
          { title: "Foreground", value: "foreground" },
          { title: "Background", value: "background" },
          { title: "Primary foreground", value: "primary-foreground" },
          { title: "Accent foreground", value: "accent-foreground" },
        ],
        layout: "dropdown",
      },
      hidden: ({ parent }) =>
        parent?.colorScheme !== "custom" ||
        (parent?.effectStyle !== "normal" && parent?.effectStyle !== "shape"),
    }),

    // HOVER COLOUR CONFIG
    defineField({
      name: "hoverColorChange",
      title: "Hover colour change",
      type: "boolean",
      initialValue: true,
      description: "Turn on to change colours on hover.",
      hidden: ({ parent }) =>
        parent?.effectStyle !== "normal" && parent?.effectStyle !== "shape",
    }),
    defineField({
      name: "hoverColorScheme",
      title: "Hover colour scheme",
      type: "string",
      options: {
        list: [
          {
            title: "Default (bg: background, text: foreground)",
            value: "default",
          },
          {
            title: "Inverted (bg: foreground, text: background)",
            value: "inverted",
          },
          {
            title: "Custom",
            value: "custom",
          },
        ],
        layout: "dropdown",
      },
      initialValue: "default",
      hidden: ({ parent }) =>
        !parent?.hoverColorChange ||
        (parent?.effectStyle !== "normal" && parent?.effectStyle !== "shape"),
    }),
    defineField({
      name: "hoverColorBgCustomToken",
      title: "Custom hover background colour",
      type: "string",
      options: {
        list: [
          { title: "Background", value: "background" },
          { title: "Foreground", value: "foreground" },
          { title: "Primary", value: "primary" },
          { title: "Accent", value: "accent" },
          { title: "Muted", value: "muted" },
        ],
        layout: "dropdown",
      },
      hidden: ({ parent }) =>
        !parent?.hoverColorChange ||
        parent?.hoverColorScheme !== "custom" ||
        (parent?.effectStyle !== "normal" && parent?.effectStyle !== "shape"),
    }),
    defineField({
      name: "hoverColorTextCustomToken",
      title: "Custom hover text colour",
      type: "string",
      options: {
        list: [
          { title: "Foreground", value: "foreground" },
          { title: "Background", value: "background" },
          { title: "Primary foreground", value: "primary-foreground" },
          { title: "Accent foreground", value: "accent-foreground" },
        ],
        layout: "dropdown",
      },
      hidden: ({ parent }) =>
        !parent?.hoverColorChange ||
        parent?.hoverColorScheme !== "custom" ||
        (parent?.effectStyle !== "normal" && parent?.effectStyle !== "shape"),
    }),

    // HOVER SCALE
    defineField({
      name: "hoverScaleUp",
      title: "Scale up on hover",
      type: "boolean",
      description: "Subtle scale-up on hover.",
      hidden: ({ parent }) =>
        parent?.effectStyle !== "normal" && parent?.effectStyle !== "shape",
    }),

    // PERSPECTIVE TILT
    defineField({
      name: "enablePerspective",
      title: "Enable perspective tilt",
      type: "boolean",
      initialValue: false,
      description:
        "Adds a subtle 3D tilt effect between the background and the text on pointer move.",
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
