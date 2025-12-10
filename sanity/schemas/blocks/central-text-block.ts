import { defineType, defineField } from "sanity";
import { AlignCenterHorizontal } from "lucide-react";

export default defineType({
  name: "central-text-block",
  title: "Central Text Block",
  type: "object",
  icon: AlignCenterHorizontal,
  fields: [
    defineField({
      name: "body",
      title: "Body",
      type: "block-content",
    }),
  ],
  preview: {
    prepare() {
      return {
        title: "Central Text Block",
      };
    },
  },
});
