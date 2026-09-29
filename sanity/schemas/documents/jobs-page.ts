import { BriefcaseBusiness } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

const positionField = (axis: "x" | "y" | "z", title: string, min: number, max: number) =>
  defineField({
    name: axis,
    title,
    type: "number",
    description: `Scene coordinate from ${min} to ${max}. Leave empty for automatic placement.`,
    validation: (rule) => rule.min(min).max(max),
  });

export default defineType({
  name: "jobsPage",
  title: "Jobs",
  type: "document",
  icon: BriefcaseBusiness,
  groups: [
    { name: "content", title: "Page content", default: true },
    { name: "roles", title: "Open roles" },
    { name: "seo", title: "SEO" },
  ],
  initialValue: {
    title: "Jobs",
    eyebrow: "The Pathetic waiting room",
    emptyMessage: "No open roles right now. Move some furniture while you wait.",
    jobs: [
      {
        _key: "creative-strategist",
        _type: "jobOpening",
        active: true,
        title: "Creative Strategist",
        starColor: "yellow",
        team: "Creative",
        location: "New York / Remote",
        employmentType: "Full time",
        summary: "Help turn internet culture into ideas people actually want to pass around.",
        applyLabel: "Apply for this role",
      },
      {
        _key: "motion-designer",
        _type: "jobOpening",
        active: true,
        title: "Motion Designer",
        starColor: "pink",
        team: "Design",
        location: "New York / Remote",
        employmentType: "Full time",
        summary: "Build strange, fast and memorable motion systems for brands on the internet.",
        applyLabel: "Apply for this role",
      },
      {
        _key: "producer",
        _type: "jobOpening",
        active: true,
        title: "Producer",
        starColor: "blue",
        team: "Production",
        location: "New York",
        employmentType: "Full time",
        summary: "Keep ambitious shoots, creators and chaotic ideas moving in the same direction.",
        applyLabel: "Apply for this role",
      },
    ],
  },
  fields: [
    defineField({
      name: "title",
      title: "Page title",
      type: "string",
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "emptyMessage",
      title: "No-open-roles message",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "jobs",
      title: "Jobs",
      type: "array",
      group: "roles",
      description: "Each active job becomes a glowing star in the office scene. Drag entries to control their order.",
      of: [
        defineArrayMember({
          name: "jobOpening",
          title: "Job opening",
          type: "object",
          fields: [
            defineField({
              name: "active",
              title: "Show in the scene",
              type: "boolean",
              initialValue: true,
            }),
            defineField({
              name: "title",
              title: "Role title",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "starColor",
              title: "Star colour",
              type: "string",
              initialValue: "yellow",
              options: {
                layout: "dropdown",
                list: [
                  { title: "Yellow", value: "yellow" },
                  { title: "Pink", value: "pink" },
                  { title: "Blue", value: "blue" },
                  { title: "Orange", value: "orange" },
                ],
              },
              validation: (rule) => rule.required(),
            }),
            defineField({ name: "team", title: "Team", type: "string" }),
            defineField({ name: "location", title: "Location", type: "string" }),
            defineField({
              name: "employmentType",
              title: "Employment type",
              type: "string",
              options: {
                list: [
                  { title: "Full time", value: "Full time" },
                  { title: "Part time", value: "Part time" },
                  { title: "Freelance", value: "Freelance" },
                  { title: "Contract", value: "Contract" },
                  { title: "Internship", value: "Internship" },
                ],
              },
            }),
            defineField({
              name: "summary",
              title: "Short description",
              type: "text",
              rows: 4,
              validation: (rule) => rule.max(420),
            }),
            defineField({
              name: "applyUrl",
              title: "Application URL",
              type: "url",
              validation: (rule) =>
                rule.uri({
                  allowRelative: true,
                  scheme: ["http", "https", "mailto"],
                }),
            }),
            defineField({
              name: "applyLabel",
              title: "Application button label",
              type: "string",
              initialValue: "Apply for this role",
            }),
            defineField({
              name: "position",
              title: "Custom star position",
              type: "object",
              options: { collapsible: true, collapsed: true },
              fields: [
                positionField("x", "Left / right (X)", -5.2, 5.2),
                positionField("y", "Height (Y)", -0.28, 4.6),
                positionField("z", "Front / back (Z)", -4.9, 4.9),
              ],
            }),
          ],
          preview: {
            select: {
              title: "title",
              team: "team",
              active: "active",
            },
            prepare: ({ title, team, active }) => ({
              title: title || "Untitled role",
              subtitle: `${active === false ? "Hidden" : "Live star"}${team ? ` · ${team}` : ""}`,
            }),
          },
        }),
      ],
    }),
    defineField({ name: "meta_title", title: "Meta title", type: "string", group: "seo" }),
    defineField({ name: "meta_description", title: "Meta description", type: "text", group: "seo" }),
    defineField({ name: "noindex", title: "No index", type: "boolean", initialValue: false, group: "seo" }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title || "Jobs",
      subtitle: "Singleton",
    }),
  },
});
