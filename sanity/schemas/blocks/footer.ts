import { defineField, defineType } from "sanity";
import { PanelBottom } from "lucide-react";

export default defineType({
  name: "footer",
  title: "Footer",
  type: "object",
  icon: PanelBottom,
  fields: [
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
      return { title: "Footer" };
    },
  },
});
