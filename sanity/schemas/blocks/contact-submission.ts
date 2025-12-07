import { defineField, defineType } from "sanity";
import { Mail } from "lucide-react";

export default defineType({
  name: "contactSubmission",
  type: "document",
  title: "Contact Submission",
  icon: Mail,
  fields: [
    defineField({
      name: "name",
      type: "string",
      title: "Name",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "email",
      type: "string",
      title: "Email",
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: "message",
      type: "text",
      title: "Message",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "submittedAt",
      type: "datetime",
      title: "Submitted at",
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "email",
      submittedAt: "submittedAt",
    },
    prepare(selection) {
      const { title, subtitle, submittedAt } = selection;
      return {
        title: title || "Unnamed",
        subtitle: `${subtitle || "No email"} • ${submittedAt ? new Date(submittedAt).toLocaleString() : "No date"
          }`,
      };
    },
  },
});
