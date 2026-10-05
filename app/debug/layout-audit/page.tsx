import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LayoutAudit from "./report";

export const metadata: Metadata = {
  title: { absolute: "Layout audit — PATHETIC" },
  robots: { index: false, follow: false },
};

export default function LayoutAuditPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <LayoutAudit />;
}
