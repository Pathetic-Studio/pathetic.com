import { defineField, defineType } from "sanity";
import { Orbit } from "lucide-react";

const eyeField = defineField({
  name: "networkEye",
  title: "Eye",
  type: "object",
  fields: [
    defineField({
      name: "x",
      title: "Desktop horizontal position (%)",
      type: "number",
      validation: (rule) => rule.min(0).max(100),
    }),
    defineField({
      name: "y",
      title: "Desktop vertical position (%)",
      type: "number",
      validation: (rule) => rule.min(0).max(100),
    }),
    defineField({
      name: "size",
      title: "Desktop size (px)",
      type: "number",
      validation: (rule) => rule.min(28).max(220),
    }),
    defineField({
      name: "xMobile",
      title: "Mobile horizontal position (%)",
      type: "number",
      validation: (rule) => rule.min(0).max(100),
    }),
    defineField({
      name: "yMobile",
      title: "Mobile vertical position (%)",
      type: "number",
      validation: (rule) => rule.min(0).max(100),
    }),
    defineField({
      name: "sizeMobile",
      title: "Mobile size (px)",
      type: "number",
      validation: (rule) => rule.min(24).max(140),
    }),
  ],
  preview: {
    select: { x: "x", y: "y", size: "size" },
    prepare({ x, y, size }) {
      return {
        title: `Eye at ${x ?? 50}%, ${y ?? 50}%`,
        subtitle: `${size ?? 72}px`,
      };
    },
  },
});

export default defineType({
  name: "network-reach-section",
  title: "Network Reach",
  type: "object",
  icon: Orbit,
  initialValue: {
    backgroundColor: { hex: "#D8FF56" },
    textColor: { hex: "#050505" },
    eyebrow: "WE DISTRIBUTE",
    headlineLead: "OUR WORK TO",
    headlineMain: "MILLIONS",
    description:
      "@PATHETIC reaches 50+ million creatives and professionals every month through owned media.",
    enableClickToAddEyes: true,
    eyeSpawnMinScale: 0.55,
    eyeSpawnMaxScale: 1.35,
    eyes: [
      { _key: "eye-one", _type: "networkEye", x: 12, y: 28, size: 74, xMobile: 13, yMobile: 24, sizeMobile: 54 },
      { _key: "eye-two", _type: "networkEye", x: 25, y: 11, size: 58, xMobile: 73, yMobile: 11, sizeMobile: 44 },
      { _key: "eye-three", _type: "networkEye", x: 76, y: 11, size: 54, xMobile: 87, yMobile: 34, sizeMobile: 48 },
      { _key: "eye-four", _type: "networkEye", x: 89, y: 26, size: 104, xMobile: 15, yMobile: 63, sizeMobile: 66 },
      { _key: "eye-five", _type: "networkEye", x: 79, y: 43, size: 78, xMobile: 87, yMobile: 69, sizeMobile: 60 },
      { _key: "eye-six", _type: "networkEye", x: 23, y: 48, size: 56, xMobile: 22, yMobile: 87, sizeMobile: 42 },
    ],
    brandLabel: "YOUR\nBRAND\nGOES HERE",
    orbitDuration: 28,
    orbitTilt: 48,
    reachPoints: [
      { _key: "reach-followers", _type: "networkReachPoint", value: "218,000+", label: "FOLLOWERS", angle: 270 },
      { _key: "reach-impressions", _type: "networkReachPoint", value: "50 MILLION+", label: "MONTHLY IMPRESSIONS", angle: 32 },
      { _key: "reach-shares", _type: "networkReachPoint", value: "126,000+", label: "MONTHLY SHARES", angle: 142 },
    ],
    detailStats: [
      { _key: "detail-age", _type: "networkDetailStat", title: "AGE GROUPS", value: "80% 25–44\n17% 18–24" },
      { _key: "detail-countries", _type: "networkDetailStat", title: "TOP COUNTRIES", value: "USA, UK, GERMANY,\nITALY" },
      { _key: "detail-cities", _type: "networkDetailStat", title: "TOP CITIES", value: "NYC, LONDON, PARIS,\nBERLIN, LA" },
    ],
    friendsTitle: "AND WE BRING FRIENDS",
    friendsDescription:
      "We partner with creators to amplify creative campaigns and ownable, repeatable formats for brands to reach new audiences.",
  },
  fields: [
    defineField({ name: "anchor", title: "Section Anchor", type: "sectionAnchor" }),
    defineField({
      name: "backgroundColor",
      title: "Background colour",
      type: "color",
    }),
    defineField({ name: "textColor", title: "Text colour", type: "color" }),
    defineField({ name: "eyebrow", title: "Top line", type: "string" }),
    defineField({
      name: "headlineLead",
      title: "Headline first line",
      type: "string",
      validation: (rule) => rule.required().max(40),
    }),
    defineField({
      name: "headlineMain",
      title: "Headline main line",
      type: "string",
      validation: (rule) => rule.required().max(32),
    }),
    defineField({
      name: "description",
      title: "Intro copy",
      type: "text",
      rows: 3,
      validation: (rule) => rule.max(220),
    }),
    defineField({
      name: "eyes",
      title: "Starting eyes",
      description: "These eyes follow the pointer. Visitors can add more without changing Sanity.",
      type: "array",
      validation: (rule) => rule.max(14),
      of: [eyeField],
    }),
    defineField({
      name: "enableClickToAddEyes",
      title: "Let visitors add eyes",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "eyeSpawnMinScale",
      title: "Smallest added eye scale",
      type: "number",
      initialValue: 0.55,
      validation: (rule) => rule.min(0.3).max(2),
    }),
    defineField({
      name: "eyeSpawnMaxScale",
      title: "Largest added eye scale",
      type: "number",
      initialValue: 1.35,
      validation: (rule) => rule.min(0.3).max(2.5),
    }),
    defineField({
      name: "brandLabel",
      title: "Central brand label",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required().max(60),
    }),
    defineField({
      name: "brandImage",
      title: "Central brand image",
      description: "Optional transparent PNG. The hooded brand graphic is used until one is supplied.",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Alternative text", type: "string" })],
    }),
    defineField({
      name: "orbitDuration",
      title: "Statistic orbit duration (seconds)",
      type: "number",
      initialValue: 28,
      validation: (rule) => rule.min(12).max(90),
    }),
    defineField({
      name: "orbitTilt",
      title: "Orbit perspective tilt (degrees)",
      description: "Higher values make the orbit look flatter and more horizontal.",
      type: "number",
      initialValue: 48,
      validation: (rule) => rule.min(45).max(82),
    }),
    defineField({
      name: "reachPoints",
      title: "Orbiting reach points",
      description: "Add as many points as needed. Leave angle empty to space a point automatically.",
      type: "array",
      validation: (rule) => rule.min(1).max(8),
      of: [
        defineField({
          name: "networkReachPoint",
          title: "Reach point",
          type: "object",
          fields: [
            defineField({ name: "value", title: "Value", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "label", title: "Label", type: "string", validation: (rule) => rule.required() }),
            defineField({
              name: "angle",
              title: "Starting angle (degrees)",
              description: "0 is the top, 90 is the right, 180 is the bottom.",
              type: "number",
              validation: (rule) => rule.min(0).max(359),
            }),
          ],
          preview: { select: { title: "value", subtitle: "label" } },
        }),
      ],
    }),
    defineField({
      name: "detailStats",
      title: "Star statistics",
      type: "array",
      validation: (rule) => rule.max(5),
      of: [
        defineField({
          name: "networkDetailStat",
          title: "Star statistic",
          type: "object",
          fields: [
            defineField({ name: "title", title: "Title", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "value", title: "Value", type: "text", rows: 3, validation: (rule) => rule.required() }),
          ],
          preview: { select: { title: "title", subtitle: "value" } },
        }),
      ],
    }),
    defineField({
      name: "friendsTitle",
      title: "Friends title",
      type: "string",
      validation: (rule) => rule.required().max(60),
    }),
    defineField({
      name: "friendsDescription",
      title: "Friends copy",
      type: "text",
      rows: 3,
      validation: (rule) => rule.max(240),
    }),
    defineField({
      name: "friends",
      title: "Friends",
      description: "Use transparent portrait cutouts. Their upper sections overlap in the row.",
      type: "array",
      validation: (rule) => rule.max(16),
      of: [
        defineField({
          name: "networkFriend",
          title: "Friend",
          type: "object",
          fields: [
            defineField({ name: "name", title: "Name", type: "string", validation: (rule) => rule.required() }),
            defineField({
              name: "image",
              title: "Square image",
              type: "image",
              options: { hotspot: true },
              fields: [defineField({ name: "alt", title: "Alternative text", type: "string" })],
            }),
          ],
          preview: { select: { title: "name", media: "image" } },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "headlineMain", subtitle: "friendsTitle" },
    prepare({ title, subtitle }) {
      return {
        title: title ? `Network Reach — ${title}` : "Network Reach",
        subtitle: subtitle || "Eyes, orbiting reach points and friends",
      };
    },
  },
});
