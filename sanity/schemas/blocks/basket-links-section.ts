import { defineField, defineType } from "sanity";
import { ShoppingBasket } from "lucide-react";

const localAssets = [
  { title: "Computer", value: "computer" },
  { title: "Black object", value: "object-black" },
  { title: "Magazine", value: "magazine" },
  { title: "Portal", value: "portal" },
  { title: "Smoothie", value: "smoothie" },
  { title: "Hoodie", value: "hoodie" },
  { title: "Pigeon", value: "pigeon" },
];

const defaultItems = [
  { _key: "computer", _type: "basketLinkItem", title: "Computer", localAsset: "computer", size: 24, startX: 69, startY: 57 },
  { _key: "black-object", _type: "basketLinkItem", title: "Basket item", localAsset: "object-black", size: 18, startX: 29, startY: 30 },
  { _key: "magazine", _type: "basketLinkItem", title: "Magazine", localAsset: "magazine", size: 18, startX: 76, startY: 28 },
  { _key: "portal", _type: "basketLinkItem", title: "Portal", localAsset: "portal", size: 25, startX: 43, startY: 64 },
  { _key: "smoothie", _type: "basketLinkItem", title: "Smoothie", localAsset: "smoothie", size: 14, startX: 53, startY: 30 },
  { _key: "hoodie", _type: "basketLinkItem", title: "Hoodie", localAsset: "hoodie", size: 21, startX: 27, startY: 66 },
  { _key: "pigeon", _type: "basketLinkItem", title: "Pigeon", localAsset: "pigeon", size: 21, startX: 37, startY: 38 },
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
