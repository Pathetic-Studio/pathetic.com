import { defineField, defineType } from "sanity";

export default defineType({
  name: "link",
  type: "object",
  title: "Link",
  fields: [
    defineField({
      name: "linkType",
      type: "string",
      title: "Link type",
      initialValue: "internal",
      options: {
        list: [
          { title: "Internal page/post", value: "internal" },
          { title: "External URL", value: "external" },
          { title: "Contact modal", value: "contact" },
          { title: "Anchor (on-page)", value: "anchor-link" },
          { title: "File download", value: "download" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
    }),

    defineField({
      name: "internalLink",
      type: "reference",
      title: "Internal link",
      to: [{ type: "page" }, { type: "post" }],
      hidden: ({ parent }) => parent?.linkType !== "internal",
    }),

    defineField({
      name: "href",
      title: "URL",
      type: "url",
      hidden: ({ parent }) => parent?.linkType !== "external",
      validation: (Rule) =>
        Rule.uri({
          allowRelative: true,
          scheme: ["http", "https", "mailto", "tel"],
        }),
    }),

    defineField({
      name: "target",
      type: "boolean",
      title: "Open in new tab",
      initialValue: false,
      hidden: ({ parent }) => parent?.linkType !== "external",
    }),

    // ✅ NEW: which page owns the anchor
    defineField({
      name: "anchorPage",
      type: "reference",
      title: "Anchor page (optional)",
      description:
        "If set, anchor links will navigate to that page + the anchor. Leave empty for same-page anchors.",
      to: [{ type: "page" }],
      hidden: ({ parent }) => parent?.linkType !== "anchor-link",
    }),

    defineField({
      name: "anchorId",
      type: "string",
      title: "Anchor ID",
      description: "ID of the section on this page (no #).",
      hidden: ({ parent }) => parent?.linkType !== "anchor-link",
    }),

    defineField({
      name: "anchorOffsetPercent",
      type: "number",
      title: "Viewport offset (%)",
      description:
        "How far from the top of the viewport the section should land (0–100).",
      validation: (Rule) => Rule.min(0).max(100),
      hidden: ({ parent }) => parent?.linkType !== "anchor-link",
    }),

    defineField({
      name: "downloadFile",
      type: "file",
      title: "File to download",
      options: {
        storeOriginalFilename: true,
      },
      hidden: ({ parent }) => parent?.linkType !== "download",
    }),

    defineField({
      name: "downloadFilename",
      type: "string",
      title: "Download filename (optional)",
      description: "If empty, the browser will use the original file name.",
      hidden: ({ parent }) => parent?.linkType !== "download",
    }),

    defineField({
      name: "title",
      type: "string",
    }),

    defineField({
      name: "buttonVariant",
      type: "button-variant",
      title: "Button Variant",
    }),

    defineField({
      name: "particlesEnabled",
      type: "boolean",
      title: "Particles (on/off)",
      initialValue: false,
      description: "If on, this button will fire particles on hover.",
    }),

    defineField({
      name: "particleImages",
      type: "array",
      title: "Particle images",
      of: [
        {
          type: "image",
          options: { hotspot: true },
        },
      ],
      hidden: ({ parent }: { parent?: { particlesEnabled?: boolean } }) =>
        !parent?.particlesEnabled,
      validation: (Rule) =>
        Rule.custom((val, ctx) => {
          const parent = ctx.parent as { particlesEnabled?: boolean } | undefined;
          if (parent?.particlesEnabled && (!val || val.length === 0)) {
            return "Add at least one particle image or turn particles off.";
          }
          return true;
        }),
    }),

    defineField({
      name: "imageEnabled",
      type: "boolean",
      title: "Image (on/off)",
      initialValue: false,
      description: "If on, an image will be placed behind the button (centered).",
    }),

    defineField({
      name: "imageBehindButton",
      type: "array",
      title: "Image behind button",
      of: [
        {
          type: "image",
          options: { hotspot: true },
        },
      ],
      hidden: ({ parent }: { parent?: { imageEnabled?: boolean } }) =>
        !parent?.imageEnabled,
      validation: (Rule) =>
        Rule.custom((val, ctx) => {
          const parent = ctx.parent as { imageEnabled?: boolean } | undefined;
          if (parent?.imageEnabled) {
            if (!val || val.length === 0) return "Add an image or turn the image off.";
            if (val.length > 1) return "Only one image is allowed.";
          }
          return true;
        }),
    }),

    defineField({
      name: "imageHoverEnabled",
      type: "boolean",
      title: "Animate image on hover",
      initialValue: false,
      description: "If on, the image behind the button will animate on hover.",
      hidden: ({ parent }: { parent?: { imageEnabled?: boolean } }) =>
        !parent?.imageEnabled,
    }),

    defineField({
      name: "imageHoverEffect",
      type: "string",
      title: "Image hover effect",
      options: {
        list: [
          { title: "Squeeze", value: "squeeze" },
          { title: "Bloat", value: "bloat" },
          { title: "Spin", value: "spin" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      hidden: ({
        parent,
      }: {
        parent?: { imageEnabled?: boolean; imageHoverEnabled?: boolean };
      }) => !parent?.imageEnabled || !parent?.imageHoverEnabled,
      validation: (Rule) =>
        Rule.custom((val, ctx) => {
          const parent = ctx.parent as { imageHoverEnabled?: boolean } | undefined;
          if (parent?.imageHoverEnabled && !val) return "Choose a hover effect.";
          return true;
        }),
    }),
  ],
  preview: {
    select: {
      title: "title",
      linkType: "linkType",
      anchorId: "anchorId",
      anchorPageSlug: "anchorPage.slug.current",
    },
    prepare({ title, linkType, anchorId, anchorPageSlug }) {
      const prefix =
        linkType === "contact"
          ? "Contact →"
          : linkType === "external"
            ? "External →"
            : linkType === "anchor-link"
              ? "Anchor →"
              : linkType === "download"
                ? "Download →"
                : "Internal →";

      const extra =
        linkType === "anchor-link"
          ? ` ${anchorPageSlug ? `/${anchorPageSlug}` : "(this page)"}#${anchorId ?? ""}`
          : "";

      return {
        title: title || "Untitled link",
        subtitle: `${prefix}${extra}`,
      };
    },
  },
});
