import { defineField, defineType } from "sanity";
import { Menu } from "lucide-react";

export default defineType({
  name: "navigation",
  title: "Navigation",
  type: "document",
  icon: Menu,
  fields: [
    defineField({
      name: "leftLinks",
      title: "Left Links (left of logo)",
      type: "array",
      of: [{ type: "link" }],
    }),
    defineField({
      name: "rightLinks",
      title: "Right Links (right of logo, in box)",
      type: "array",
      of: [{ type: "link" }],
    }),
    defineField({
      name: "footerLeftLinks",
      title: "Footer Left Links",
      description: "Links on the left side of the footer",
      type: "array",
      of: [{ type: "link" }],
    }),
    defineField({
      name: "footerRightLinks",
      title: "Footer Right Links",
      description: "Links on the right side of the footer",
      type: "array",
      of: [{ type: "link" }],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Navigation" };
    },
  },
});
