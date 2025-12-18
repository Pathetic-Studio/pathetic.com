// sanity/schemas/meme-booth.ts
import { defineField, defineType } from "sanity";
import { Camera } from "lucide-react";

export default defineType({
  name: "memeBooth",
  type: "document",
  title: "Meme Booth",
  icon: Camera,
  groups: [
    { name: "content", title: "Content" },
    { name: "seo", title: "SEO" },
    { name: "nav", title: "Nav Overrides" },
  ],
  fields: [
    // -----------------------------
    // CONTENT
    // -----------------------------
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "subtitle",
      title: "Subtitle",
      type: "text",
      rows: 3,
      group: "content",
    }),
    defineField({
      name: "showNewsletterModalOnView",
      title: "Show newsletter modal when page is viewed",
      type: "boolean",
      initialValue: false,
      group: "content",
      description:
        "If enabled, the Meme Booth newsletter modal will open when this page comes into view.",
    }),

    // -----------------------------
    // NAV OVERRIDES
    // -----------------------------

    // Desktop
    defineField({
      name: "showDesktopRightLinks",
      title: "Show desktop right links",
      type: "boolean",
      initialValue: true,
      group: "nav",
      description:
        "If disabled, the desktop right links will animate off on the Meme Booth route.",
    }),
    defineField({
      name: "leftNavReplace",
      title: "Left nav replace (desktop)",
      type: "array",
      group: "nav",
      description:
        "If this has items, the normal desktop left links animate off and these links animate on for Meme Booth.",
      of: [{ type: "link" }],
    }),

    // Mobile menu
    defineField({
      name: "showMobileBottomLinks",
      title: "Show mobile bottom links",
      type: "boolean",
      initialValue: true,
      group: "nav",
      description:
        "If disabled, the bottom section of the mobile menu is hidden on Meme Booth.",
    }),
    defineField({
      name: "mobileTopReplace",
      title: "Mobile top replace (mobile menu)",
      type: "array",
      group: "nav",
      description:
        "If this has items, the normal mobile TOP links are replaced by these links on Meme Booth.",
      of: [{ type: "link" }],
    }),

    // -----------------------------
    // SEO
    // -----------------------------
    defineField({
      name: "meta_title",
      title: "Meta Title",
      type: "string",
      group: "seo",
    }),
    defineField({
      name: "meta_description",
      title: "Meta Description",
      type: "text",
      group: "seo",
    }),
    defineField({
      name: "noindex",
      title: "No Index",
      type: "boolean",
      initialValue: false,
      group: "seo",
    }),
    defineField({
      name: "ogImage",
      title: "Open Graph Image - [1200x630]",
      type: "image",
      group: "seo",
      options: { hotspot: true },
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "subtitle" },
    prepare({ title, subtitle }) {
      return { title: title || "Meme Booth", subtitle };
    },
  },
});
