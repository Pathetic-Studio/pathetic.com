import { defineField, defineType } from "sanity";
import { Camera } from "lucide-react";

export default defineType({
  name: "memeBooth",
  type: "document",
  title: "Meme Booth",
  icon: Camera,
  groups: [
    {
      name: "content",
      title: "Content",
    },
    {
      name: "seo",
      title: "SEO",
    },
  ],
  fields: [
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

    // SEO
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
      options: {
        hotspot: true,
      },
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "subtitle",
    },
    prepare({ title, subtitle }) {
      return {
        title: title || "Meme Booth",
        subtitle,
      };
    },
  },
});
