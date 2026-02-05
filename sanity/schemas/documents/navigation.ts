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
      name: "instagram",
      type: "url",
      title: "Instagram Link",
      description: "Full Instagram profile URL",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Navigation" };
    },
  },
});
