import { defineField, defineType } from "sanity";
import { Sparkles } from "lucide-react";
import gridRowAnimated from "./grid/grid-row-animated";

export default defineType({
  name: "belief-section",
  title: "What We Believe",
  type: "object",
  icon: Sparkles,
  initialValue: {
    title: "WHAT WE BELIEVE",
    cloudsEnabled: true,
    cloudPartDuration: 1.6,
  },
  fields: [
    ...gridRowAnimated.fields,
    defineField({
      name: "cloudsEnabled",
      title: "Show parting clouds",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "cloudImage",
      title: "Cloud image",
      description:
        "Optional transparent cloud image. The site cloud asset is used by default.",
      type: "image",
      fields: [
        defineField({
          name: "alt",
          title: "Alternative text",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "cloudPartDuration",
      title: "Cloud part duration (seconds)",
      type: "number",
      initialValue: 1.6,
      validation: (rule) => rule.min(0.5).max(3),
    }),
  ],
  preview: {
    select: {
      title: "title",
      firstColumnTitle: "columns.0.title",
    },
    prepare({ title, firstColumnTitle }) {
      return {
        title: "What We Believe",
        subtitle: title || firstColumnTitle || "No title",
        media: Sparkles,
      };
    },
  },
});
