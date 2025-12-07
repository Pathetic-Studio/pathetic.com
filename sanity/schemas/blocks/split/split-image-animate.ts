// sanity/schemas/blocks/split/split-image-animate.ts
import { defineField, defineType } from "sanity";
import { Images } from "lucide-react";

export default defineType({
  name: "split-image-animate",
  type: "object",
  icon: Images,
  title: "Split Image Animate",
  fields: [
    defineField({
      name: "useCustomEffect",
      title: "Use custom effect instead of gallery",
      type: "boolean",
      description:
        "If enabled, uses the built-in effect stack instead of fading between uploaded images.",
      initialValue: false,
    }),
    defineField({
      name: "images",
      title: "Images (used when custom effect is off)",
      type: "array",
      of: [{ type: "image" }],
    }),
  ],
  preview: {
    select: {
      title: "images.0.asset.originalFilename",
      useCustomEffect: "useCustomEffect",
    },
    prepare({ title, useCustomEffect }) {
      return {
        title: useCustomEffect ? "Custom Effect" : title || "Animated Image",
        subtitle: useCustomEffect ? "Base + overlay effects" : "Fade between images",
      };
    },
  },
});
