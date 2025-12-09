// sanity/desk/structure.ts
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import { createBulkActionsTable } from "sanity-plugin-bulk-actions-table";
import {
  Files,
  Menu,
  Settings,
  Mail,
  Camera,
  Loader2,
} from "lucide-react";

export const structure = (S: any, context: any) =>
  S.list()
    .title("Content")
    .items([
      // Pages
      orderableDocumentListDeskItem({
        type: "page",
        title: "Pages",
        icon: Files,
        S,
        context,
      }),

      // HIDDEN:
      // S.listItem().title("Posts")...
      // orderableDocumentListDeskItem({ type: "category" })
      // orderableDocumentListDeskItem({ type: "author" })
      // orderableDocumentListDeskItem({ type: "faq" })
      // orderableDocumentListDeskItem({ type: "testimonial" })

      // Meme Booth – single document
      S.listItem()
        .title("Meme Booth")
        .icon(Camera)
        .child(
          S.editor()
            .id("memeBooth")
            .schemaType("memeBooth")
            .documentId("memeBooth")
        ),

      // Page Loader
      S.listItem()
        .title("Page Loader")
        .icon(Loader2)
        .child(
          S.editor()
            .id("pageLoader")
            .schemaType("pageLoader")
            .documentId("pageLoader")
        ),

      // Contact Submissions
      createBulkActionsTable({
        type: "contactSubmission",
        S,
        context,
        title: "Contact form submissions",
        icon: Mail,
      }),

      S.divider({ title: "Global" }),

      // Navigation
      S.listItem()
        .title("Navigation")
        .icon(Menu)
        .child(
          S.editor()
            .id("navigation")
            .schemaType("navigation")
            .documentId("navigation")
        ),

      // Settings
      S.listItem()
        .title("Settings")
        .icon(Settings)
        .child(
          S.editor()
            .id("settings")
            .schemaType("settings")
            .documentId("settings")
        ),
    ]);
