// sanity/schemas/objects/link.ts
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

    defineField({
      name: "title",
      type: "string",
    }),

    defineField({
      name: "buttonVariant",
      type: "button-variant",
      title: "Button Variant",
    }),
  ],
  preview: {
    select: {
      title: "title",
      linkType: "linkType",
    },
    prepare({ title, linkType }) {
      const prefix =
        linkType === "contact"
          ? "Contact →"
          : linkType === "external"
            ? "External →"
            : "Internal →";

      return {
        title: title || "Untitled link",
        subtitle: prefix,
      };
    },
  },
});
