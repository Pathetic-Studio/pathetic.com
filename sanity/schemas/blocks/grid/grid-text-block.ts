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
      name: "useDecorativeTitle",
      title: "Decorative title",
      type: "boolean",
      initialValue: true,
      description:
        "When enabled, the title uses the squished decorative renderer. When off, it renders as regular portable text.",
    }),
    defineField({
      name: "bodyPortable",
      title: "Body",
      type: "block-content",
    }),
    defineField({
      name: "useDecorativeBody",
      title: "Decorative body",
      type: "boolean",
      initialValue: false,
      description:
        "When enabled, the body uses the squished decorative renderer. When off, it renders as regular portable text.",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alternative Text",
        }),
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
          { title: "Retro", value: "retro" },
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

    // BASE COLOUR SCHEME (normal + shape + retro)
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
            title: "Custom (hex values)",
            value: "custom",
          },
        ],
        layout: "dropdown",
      },
      initialValue: "default",
      hidden: ({ parent }) =>
        !["normal", "shape", "retro"].includes(parent?.effectStyle),
    }),
    defineField({
      name: "colorBgCustom",
      title: "Custom background colour",
      type: "color",
      options: {
        disableAlpha: true,
      },
      description: "Used when Color scheme is Custom. Hex like #ffffff.",
      hidden: ({ parent }) =>
        parent?.colorScheme !== "custom" ||
        !["normal", "shape", "retro"].includes(parent?.effectStyle),
    }),
    defineField({
      name: "colorTextCustom",
      title: "Custom text colour",
      type: "color",
      options: {
        disableAlpha: true,
      },
      description: "Used when Color scheme is Custom. Hex like #000000.",
      hidden: ({ parent }) =>
        parent?.colorScheme !== "custom" ||
        !["normal", "shape", "retro"].includes(parent?.effectStyle),
    }),

    // HOVER COLOUR CONFIG (normal + shape + retro)
    defineField({
      name: "hoverColorChange",
      title: "Hover colour change",
      type: "boolean",
      initialValue: true,
      description: "Turn on to change colours on hover.",
      hidden: ({ parent }) =>
        !["normal", "shape", "retro"].includes(parent?.effectStyle),
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
            title: "Custom (hex values)",
            value: "custom",
          },
        ],
        layout: "dropdown",
      },
      initialValue: "default",
      hidden: ({ parent }) =>
        !parent?.hoverColorChange ||
        !["normal", "shape", "retro"].includes(parent?.effectStyle),
    }),
    defineField({
      name: "hoverColorBgCustom",
      title: "Custom hover background colour",
      type: "color",
      options: {
        disableAlpha: true,
      },
      description: "Used when Hover colour scheme is Custom.",
      hidden: ({ parent }) =>
        !parent?.hoverColorChange ||
        parent?.hoverColorScheme !== "custom" ||
        !["normal", "shape", "retro"].includes(parent?.effectStyle),
    }),
    defineField({
      name: "hoverColorTextCustom",
      title: "Custom hover text colour",
      type: "color",
      options: {
        disableAlpha: true,
      },
      description: "Used when Hover colour scheme is Custom.",
      hidden: ({ parent }) =>
        !parent?.hoverColorChange ||
        parent?.hoverColorScheme !== "custom" ||
        !["normal", "shape", "retro"].includes(parent?.effectStyle),
    }),

    // HOVER SCALE (normal + shape only)
    defineField({
      name: "hoverScaleUp",
      title: "Scale up on hover",
      type: "boolean",
      description: "Subtle scale-up on hover.",
      hidden: ({ parent }) =>
        !["normal", "shape"].includes(parent?.effectStyle),
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

    // RETRO HOVER BEHAVIOUR
    defineField({
      name: "retroHoverDepress",
      title: "Depress on hover (retro)",
      type: "boolean",
      initialValue: true,
      description:
        "When enabled, the retro bevel inverts and the card appears pressed on hover/click.",
      hidden: ({ parent }) => parent?.effectStyle !== "retro",
    }),
  ],
  preview: {
    select: {
      effectStyle: "effectStyle",
    },
    prepare({ effectStyle }) {
      return {
        title: "Grid Text Block",
        subtitle: effectStyle
          ? `Effect: ${effectStyle}`
          : "Portable text title & body",
        media: LayoutGrid,
      };
    },
  },
});
