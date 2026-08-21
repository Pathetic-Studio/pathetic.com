import type { ColorVariant } from "@/sanity.types";

export const SECTION_SURFACE_CLASSES: Record<ColorVariant, string> = {
  background: "bg-background text-foreground",
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  card: "bg-card text-card-foreground",
  accent: "bg-accent text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  muted: "bg-muted text-muted-foreground",
};

export function getSectionSurfaceClass(
  color: ColorVariant | null | undefined,
) {
  return SECTION_SURFACE_CLASSES[color || "background"];
}
