import { defineField, defineType } from "sanity";
import { GalleryVerticalEnd } from "lucide-react";

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
  name: "caseStudy",
  title: "Case Study",
  type: "document",
  icon: GalleryVerticalEnd,
  groups: [
    { name: "content", title: "Content" },
    { name: "related", title: "More work" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Project title",
      type: "string",
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      group: "content",
    }),
    imageWithAlt("heroImage", "Central hero image"),
    defineField({
      name: "heroOrbitImages",
      title: "Images around the hero",
      type: "array",
      group: "content",
      validation: (rule) => rule.max(8),
      of: [imageWithAlt("heroOrbitImage", "Orbit image")],
    }),
    defineField({
      name: "intro",
      title: "Introduction",
      type: "block-content",
      group: "content",
    }),
    defineField({
      name: "storySections",
      title: "Story sections",
      type: "array",
      group: "content",
      of: [
        defineField({
          name: "caseStudyStorySection",
          title: "Story section",
          type: "object",
          fields: [
            imageWithAlt("image", "Image"),
            defineField({
              name: "copy",
              title: "Copy",
              type: "block-content",
            }),
            defineField({
              name: "imageWidth",
              title: "Image width",
              type: "string",
              options: {
                list: [
                  { title: "Small", value: "small" },
                  { title: "Medium", value: "medium" },
                  { title: "Large", value: "large" },
                ],
                layout: "radio",
              },
              initialValue: "medium",
            }),
          ],
          preview: {
            select: { media: "image" },
            prepare: ({ media }) => ({ title: "Story section", media }),
          },
        }),
      ],
    }),
    defineField({
      name: "relatedTitle",
      title: "More-work title",
      type: "string",
      group: "related",
      initialValue: "View more of our work",
    }),
    defineField({
      name: "relatedProjects",
      title: "Related projects",
      type: "array",
      group: "related",
      validation: (rule) => rule.max(4),
      of: [
        defineField({
          name: "relatedCaseStudy",
          title: "Related project",
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            imageWithAlt("image", "Image"),
            defineField({ name: "link", title: "Link", type: "link" }),
          ],
          preview: { select: { title: "title", media: "image" } },
        }),
      ],
    }),
    defineField({
      name: "meta_title",
      title: "Meta title",
      type: "string",
      group: "seo",
    }),
    defineField({
      name: "meta_description",
      title: "Meta description",
      type: "text",
      group: "seo",
    }),
    defineField({
      name: "noindex",
      title: "No index",
      type: "boolean",
      initialValue: false,
      group: "seo",
    }),
    imageWithAlt("ogImage", "Open Graph image"),
  ],
  preview: {
    select: { title: "title", media: "heroImage" },
    prepare: ({ title, media }) => ({
      title: title || "Case Study",
      subtitle: "Singleton",
      media,
    }),
  },
});
