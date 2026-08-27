import { defineField, defineType } from "sanity";
import { Grid3X3 } from "lucide-react";

const cellField = defineField({
  name: "bingoFooterCell",
  title: "Bingo cell",
  type: "object",
  fields: [
    defineField({ name: "label", title: "Label", type: "string" }),
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      initialValue: "none",
      options: { list: [{ title: "None", value: "none" }, { title: "Star", value: "star" }] },
    }),
    defineField({
      name: "action",
      title: "Action",
      type: "string",
      initialValue: "link",
      options: {
        list: [
          { title: "Normal link", value: "link" },
          { title: "Open contact modal", value: "contact" },
          { title: "Open newsletter modal", value: "newsletter" },
          { title: "Display only", value: "none" },
        ],
      },
    }),
    defineField({
      name: "link",
      title: "Link",
      type: "link",
      hidden: ({ parent }) => parent?.action !== "link",
    }),
    defineField({ name: "column", title: "Column", type: "number", validation: (rule) => rule.required().integer().min(1).max(3) }),
    defineField({ name: "row", title: "Row", type: "number", validation: (rule) => rule.required().integer().min(1).max(4) }),
  ],
  preview: {
    select: { title: "label", column: "column", row: "row", icon: "icon" },
    prepare({ title, column, row, icon }) {
      return { title: title || (icon === "star" ? "Star" : "Empty cell"), subtitle: `Column ${column || 1}, row ${row || 1}` };
    },
  },
});

export default defineType({
  name: "bingo-footer",
  title: "Bingo Footer",
  type: "object",
  icon: Grid3X3,
  initialValue: {
    backgroundColor: { hex: "#FFFFFF" },
    textColor: { hex: "#050505" },
    leftCells: [
      { _key: "newsletter", _type: "bingoFooterCell", label: "NEWS\nLETTER", action: "newsletter", icon: "none", column: 3, row: 1 },
      { _key: "privacy", _type: "bingoFooterCell", label: "PRIVACY\nPOLICY", action: "none", icon: "none", column: 2, row: 2 },
      { _key: "work", _type: "bingoFooterCell", label: "WORK", action: "none", icon: "none", column: 1, row: 4 },
      { _key: "talent", _type: "bingoFooterCell", label: "TALENT\nMATRIX", action: "none", icon: "none", column: 3, row: 4 },
    ],
    rightCells: [
      { _key: "insta", _type: "bingoFooterCell", label: "INSTA", action: "none", icon: "none", column: 1, row: 1 },
      { _key: "contact", _type: "bingoFooterCell", label: "CONTACT", action: "contact", icon: "none", column: 3, row: 1 },
      { _key: "shop", _type: "bingoFooterCell", label: "SHOP", action: "none", icon: "none", column: 1, row: 3 },
      { _key: "star", _type: "bingoFooterCell", label: "", action: "none", icon: "star", column: 1, row: 4 },
      { _key: "careers", _type: "bingoFooterCell", label: "CAREERS", action: "none", icon: "none", column: 3, row: 4 },
    ],
  },
  fields: [
    defineField({ name: "backgroundColor", title: "Background colour", type: "color" }),
    defineField({ name: "textColor", title: "Text colour", type: "color" }),
    defineField({ name: "leftCells", title: "Left bingo links", type: "array", validation: (rule) => rule.max(12), of: [cellField] }),
    defineField({ name: "rightCells", title: "Right bingo links", type: "array", validation: (rule) => rule.max(12), of: [cellField] }),
  ],
  preview: {
    prepare() {
      return { title: "Bingo Footer", subtitle: "New grid footer", media: Grid3X3 };
    },
  },
});
