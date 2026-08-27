import { defineField, defineType } from "sanity";
import { GalleryHorizontal } from "lucide-react";

const imageWithAlt = defineField({
  name: "image",
  title: "Image",
  type: "image",
  options: { hotspot: true },
  fields: [
    defineField({
      name: "alt",
      title: "Alternative text",
      type: "string",
      validation: (rule) => rule.required(),
    }),
  ],
});

export default defineType({
  name: "lifecycle-slideshow",
  title: "Lifecycle Slideshow",
  type: "object",
  icon: GalleryHorizontal,
  fields: [
    defineField({
      name: "anchor",
      title: "Section Anchor",
      type: "sectionAnchor",
    }),
    defineField({ name: "colorVariant", type: "color-variant" }),
    defineField({
      name: "background",
      title: "Background treatment",
      type: "background",
      description:
        "Optional solid, gradient or image layer. The colour variant still controls the text and fallback surface.",
    }),
    defineField({
      name: "displayTextStyle",
      title: "Central text style",
      type: "display-text-style",
    }),
    defineField({
      name: "pinDuration",
      title: "Desktop scroll length (screens)",
      type: "number",
      description: "How many viewport heights the three-slide sequence occupies.",
      initialValue: 7,
      validation: (rule) => rule.min(2).max(10),
    }),
    defineField({
      name: "memeSlide",
      title: "Slide 1 — Meme origins",
      type: "object",
      fields: [
        defineField({
          name: "topText",
          title: "Top text",
          type: "string",
          initialValue: "Becoming Pathetic",
        }),
        defineField({
          name: "centerText",
          title: "Central text",
          type: "text",
          rows: 3,
          initialValue:
            "@Pathetic started as an Instagram page documenting culture with memes.",
          validation: (rule) => rule.required().max(220),
        }),
        defineField({
          name: "useSanityArtwork",
          title: "Use uploaded artwork",
          type: "boolean",
          initialValue: false,
          description:
            "Off uses the supplied Pathetic slide-two artwork bundled with the site. Turn this on to use the central and orbiting images uploaded below.",
        }),
        defineField({
          name: "memes",
          title: "Meme image groups",
          type: "array",
          description:
            "Add up to four memes with roughly six source images each. Hovering any image gathers its group.",
          validation: (rule) => rule.max(4),
          of: [
            defineField({
              name: "memeGroup",
              title: "Meme group",
              type: "object",
              fields: [
                defineField({
                  name: "title",
                  title: "Internal label",
                  type: "string",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "images",
                  title: "Images",
                  type: "array",
                  validation: (rule) => rule.max(6),
                  of: [imageWithAlt],
                }),
              ],
              preview: {
                select: {
                  title: "title",
                  media: "images.0",
                },
                prepare({ title, media }) {
                  return { title: title || "Untitled meme", media };
                },
              },
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: "orbitSlide",
      title: "Slide 2 — Orbiting imagery",
      type: "object",
      fields: [
        defineField({
          name: "topText",
          title: "Top text",
          type: "string",
          initialValue: "Our startup apparel arc",
        }),
        defineField({
          name: "centerText",
          title: "Central text",
          type: "text",
          rows: 3,
          initialValue:
            "In 2024, we evolved into a brand with apparel, parties and apps.",
          validation: (rule) => rule.required().max(220),
        }),
        defineField({
          name: "centerImage",
          title: "Central image",
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Alternative text",
              type: "string",
              validation: (rule) => rule.required(),
            }),
          ],
        }),
        defineField({
          name: "orbitImages",
          title: "Orbiting images",
          type: "array",
          validation: (rule) => rule.max(12),
          of: [imageWithAlt],
        }),
        defineField({
          name: "orbitDuration",
          title: "Orbit duration (seconds)",
          type: "number",
          initialValue: 18,
          validation: (rule) => rule.min(6).max(60),
        }),
      ],
    }),
    defineField({
      name: "objectSlide",
      title: "Slide 3 — 3D object",
      type: "object",
      fields: [
        defineField({
          name: "topText",
          title: "Top text",
          type: "string",
          initialValue: "Beware the meme page → studio pipeline",
        }),
        defineField({
          name: "centerText",
          title: "Central text",
          type: "text",
          rows: 3,
          initialValue:
            "In 2025, we launched our creative studio, letting brands in on the fun.",
          validation: (rule) => rule.required().max(220),
        }),
        defineField({
          name: "model",
          title: "3D model (GLB or GLTF)",
          type: "file",
          options: {
            accept: ".glb,.gltf,model/gltf-binary,model/gltf+json",
          },
          description:
            "Upload a self-contained GLB where possible. The bundled Oakley Juliet model is used when this is empty.",
        }),
        defineField({
          name: "fallbackImage",
          title: "Fallback image",
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({ name: "alt", title: "Alternative text", type: "string" }),
          ],
        }),
        defineField({
          name: "modelScale",
          title: "Model scale",
          type: "number",
          initialValue: 1,
          validation: (rule) => rule.min(0.1).max(5),
        }),
        defineField({
          name: "rotationSpeed",
          title: "Base rotation speed",
          type: "number",
          initialValue: 0.35,
          validation: (rule) => rule.min(0.05).max(2),
        }),
        defineField({
          name: "buttonLabel",
          title: "Fun button label",
          type: "string",
          initialValue: "Hold to spin",
        }),
        defineField({
          name: "headerEffect",
          title: "Header electrical effect",
          type: "object",
          description:
            "Controls the electrical treatment applied to the feature star and Pathetic logo only while Fun mode is held.",
          fields: [
            defineField({
              name: "enabled",
              title: "Enabled",
              type: "boolean",
              initialValue: true,
            }),
            defineField({
              name: "accentColor",
              title: "Lightning colour",
              type: "color",
              initialValue: { hex: "#7ed7ff" },
            }),
            defineField({
              name: "idleIntensity",
              title: "Fun mode intensity",
              type: "number",
              initialValue: 1,
              validation: (rule) => rule.min(0.15).max(1),
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      subtitle: "memeSlide.topText",
    },
    prepare({ subtitle }) {
      return {
        title: "Lifecycle Slideshow",
        subtitle: subtitle || "Three-stage pinned story",
      };
    },
  },
});
