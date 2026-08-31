import { defineField, defineType } from "sanity";
import { ShoppingBasket } from "lucide-react";

const localAssets = [
  { title: "Newsletter pigeon", value: "pigeon" },
  { title: "Shop hoodie", value: "hoodie" },
  { title: "Jobs computer", value: "computer" },
  { title: "The Abyss portal", value: "portal" },
];

const defaultItems = [
  { _key: "pigeon", _type: "basketLinkItem", title: "Newsletter", localAsset: "pigeon", size: 23, startX: 28, startY: 34 },
  { _key: "hoodie", _type: "basketLinkItem", title: "Shop", localAsset: "hoodie", size: 23, startX: 48, startY: 39 },
  { _key: "computer", _type: "basketLinkItem", title: "Jobs", localAsset: "computer", size: 26, startX: 72, startY: 43 },
  { _key: "portal", _type: "basketLinkItem", title: "The Abyss", localAsset: "portal", size: 27, startX: 44, startY: 68 },
];

export default defineType({
  name: "basket-links-section",
  title: "Basket Links",
  type: "object",
  icon: ShoppingBasket,
  initialValue: {
    title: "THE PATHETIC BASKET",
    hint: "(PSSSST — YOU HAVE TO CLICK ON IT)",
    backgroundColor: { hex: "#FFFFFF" },
    items: defaultItems,
  },
  fields: [
    defineField({ name: "anchor", title: "Section Anchor", type: "sectionAnchor" }),
    defineField({ name: "title", title: "Accessible section title", type: "string" }),
    defineField({ name: "hint", title: "Hint below basket", type: "string" }),
    defineField({ name: "backgroundColor", title: "Background colour", type: "color" }),
    defineField({
      name: "basketImage",
      title: "Optional replacement basket",
      description: "Leave empty to use the supplied red basket.",
      type: "image",
      fields: [defineField({ name: "alt", title: "Alternative text", type: "string" })],
    }),
    defineField({
      name: "items",
      title: "Basket links",
      type: "array",
      validation: (rule) => rule.max(12),
      of: [
        defineField({
          name: "basketLinkItem",
          title: "Basket link",
          type: "object",
          fields: [
            defineField({ name: "title", title: "Title", type: "string", validation: (rule) => rule.required() }),
            defineField({
              name: "localAsset",
              title: "Supplied artwork",
              description: "Used until a custom image is uploaded below.",
              type: "string",
              options: { list: localAssets },
            }),
            defineField({
              name: "image",
              title: "Custom image",
              type: "image",
              fields: [defineField({ name: "alt", title: "Alternative text", type: "string" })],
            }),
            defineField({ name: "link", title: "Link", type: "link" }),
            defineField({
              name: "size",
              title: "Size (% of basket width)",
              type: "number",
              initialValue: 20,
              validation: (rule) => rule.min(8).max(38),
            }),
            defineField({ name: "startX", title: "Starting horizontal position (%)", type: "number", validation: (rule) => rule.min(15).max(85) }),
            defineField({ name: "startY", title: "Starting vertical position (%)", type: "number", validation: (rule) => rule.min(15).max(85) }),
          ],
          preview: {
            select: { title: "title", media: "image", subtitle: "localAsset" },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return { title: "Basket Links", subtitle: title || "Physics basket", media: ShoppingBasket };
    },
  },
});
