// sanity/schemas/page-loader.ts
import { defineField, defineType } from "sanity";
import { LayoutTemplate } from "lucide-react";

export default defineType({
  name: "pageLoader",
  title: "Page Loader",
  type: "document",
  icon: LayoutTemplate,
  fields: [
    defineField({
      name: "enabled",
      title: "Enable loader",
      type: "boolean",
      initialValue: false,
      description: "If enabled, this loader will run on page load.",
    }),
    defineField({
      name: "oncePerSession",
      title: "Only once per session",
      type: "boolean",
      initialValue: true,
      description:
        "If enabled, the loader will play at most once per browser session.",
    }),
    defineField({
      name: "usePatheticIntroPreset",
      title: "Use Pathetic intro preset",
      type: "boolean",
      initialValue: true,
      description:
        "Uses the current ‘Who controls the Memes controls the Universe’ copy and bundled cropped artwork. Turn this off to use the editable title and feature images below.",
    }),

    // Same core content fields as hero-2
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
      name: "sectionHeightMobile",
      title: "Section Height (Mobile)",
      type: "string",
      options: {
        list: [
          { title: "Auto", value: "auto" },
          { title: "50vw", value: "50vw" },
          { title: "Full Height (100vh)", value: "full" },
          { title: "Custom", value: "custom" },
        ],
        layout: "radio",
      },
      initialValue: "auto",
    }),
    defineField({
      name: "customHeightMobile",
      title: "Custom Height (Mobile)",
      type: "string",
      description: "Any valid CSS height (e.g. 480px, 60vh, 50vw).",
      hidden: ({ parent }) => parent?.sectionHeightMobile !== "custom",
    }),
    defineField({
      name: "sectionHeightDesktop",
      title: "Section Height (Desktop)",
      type: "string",
      options: {
        list: [
          { title: "Auto", value: "auto" },
          { title: "50vw", value: "50vw" },
          { title: "Full Height (100vh)", value: "full" },
          { title: "Custom", value: "custom" },
        ],
        layout: "radio",
      },
      initialValue: "auto",
    }),
    defineField({
      name: "customHeightDesktop",
      title: "Custom Height (Desktop)",
      type: "string",
      description: "Any valid CSS height (e.g. 640px, 80vh, 50vw).",
      hidden: ({ parent }) => parent?.sectionHeightDesktop !== "custom",
    }),

    defineField({
      name: "background",
      title: "Background",
      type: "background",
    }),

    defineField({
      name: "feature",
      title: "Feature (sprites, effects)",
      type: "hero-feature",
      description:
        "Use the images here as sprites for the loader explosion (imageExplode) or other effects.",
    }),
  ],

  preview: {
    select: {
      title: "title",
      enabled: "enabled",
    },
    prepare({ title, enabled }) {
      return {
        title: title || "Page Loader",
        subtitle: enabled ? "Enabled" : "Disabled",
      };
    },
  },
});
