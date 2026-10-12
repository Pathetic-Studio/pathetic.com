export const BREAKPOINTS = [
  { id: "mobile", label: "Mobile", width: 390, range: "320–767px" },
  { id: "tablet", label: "Tablet", width: 768, range: "768–1023px" },
  { id: "desktop", label: "Desktop", width: 1440, range: "1024px+" },
] as const;
export type Breakpoint = typeof BREAKPOINTS[number]["id"];
export type Family = "h1" | "h2" | "h3" | "eyebrow" | "matrix" | "network";
export const FAMILY_NAMES: Record<Family, string> = {
  h1: "H1 / Page titles", h2: "H2 / Section titles", h3: "H3 / Project titles",
  eyebrow: "Eyebrows", matrix: "Talent Matrix / custom stack", network: "Our Unfair Advantage / custom stack",
};
export type HeadingGroup = { id: string; name: string; family: Family; lines: string[]; warning?: string };
// These are proposed visual families, not a silent change to the site's markup.
export const HEADING_GROUPS: HeadingGroup[] = [
  { id: "intro", name: "Intro", family: "h1", lines: ["intro"], warning: "Uses the xl preset, with a different scale at each breakpoint. Its current title tag is h2." },
  { id: "slides", name: "Memes / glasses", family: "h2", lines: ["slides"], warning: "Uses display sizing and a separate mobile font override." },
  { id: "work-eyebrow", name: "Homepage work subtitle", family: "eyebrow", lines: ["work-eyebrow"] },
  { id: "credibility", name: "Credibility", family: "h2", lines: ["credibility"], warning: "Uses a container-width font rule, with a separate 700px breakpoint." },
  { id: "services", name: "What we do", family: "h2", lines: ["services"], warning: "Uses the what-we-do preset; its tablet size is larger than desktop." },
  { id: "matrix", name: "We do this with our Talent Matrix", family: "matrix", lines: ["matrix-eyebrow", "talent", "matrix"] },
  { id: "network", name: "Our Unfair Advantage", family: "network", lines: ["our", "unfair", "advantage"] },
  { id: "friends", name: "And we bring friends", family: "h2", lines: ["friends"], warning: "Uses network-friends sizing, a fixed stretch and a separate mobile rule." },
  { id: "believe", name: "What we believe", family: "h2", lines: ["believe"] },
  { id: "are", name: "What we are", family: "h2", lines: ["are"], warning: "Shares belief sizing, but overrides the font below 575px." },
  { id: "contact", name: "Work with us", family: "h2", lines: ["contact"], warning: "Uses contact-cta sizing and its own responsive stretch." },
  { id: "work", name: "Our work · index", family: "h1", lines: ["work"], warning: "Uses the belief section preset, with a separate mobile size rule." },
  { id: "client", name: "Case study · client", family: "h1", lines: ["client"], warning: "Uses bespoke font sizing and no stretch; different from the work index." },
  { id: "project", name: "Case study · project", family: "h3", lines: ["project"], warning: "Uses bespoke CSS and is currently an h2; proposed H3 visual family." },
  { id: "next", name: "Case study · next client", family: "h3", lines: ["next"], warning: "Uses a different font size from project titles." },
];
export type StylePatch = Partial<{
  font: number; line: number; x: number; y: number; tracking: number;
  maxWidth: number; stroke: number; color: string; strokeColor: string;
}>;
export type ResponsivePatch = Partial<Record<Breakpoint, StylePatch>>;
export type StyleDraft = { version: 1; styles: Record<string, ResponsivePatch> };
export const EMPTY_DRAFT: StyleDraft = { version: 1, styles: {} };
export const DRAFT_STORAGE = "pathetic-style-draft-v1";
export const getBreakpoint = (width: number): Breakpoint => width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop";
export function draftKey(group: HeadingGroup, line: string) {
  return group.lines.length > 1 ? `${group.family}:${line}` : group.family;
}
export const NUMERIC_FIELDS = [
  { key: "font", label: "Font size", unit: "px", min: 12, max: 240, step: 1 },
  { key: "line", label: "Line height", unit: "×", min: .5, max: 2, step: .01 },
  { key: "x", label: "Text width / stretch", unit: "×", min: .25, max: 1.5, step: .01 },
  { key: "y", label: "Overall scale", unit: "×", min: .5, max: 3, step: .01 },
  { key: "tracking", label: "Letter spacing", unit: "em", min: -.12, max: .2, step: .005 },
  { key: "maxWidth", label: "Text box width", unit: "ch · 0 = auto", min: 0, max: 80, step: 1 },
  { key: "stroke", label: "CSS stroke", unit: "px", min: 0, max: 12, step: .25 },
] as const;
export function parseDraft(value: unknown): StyleDraft {
  if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1 || !("styles" in value) || !value.styles || typeof value.styles !== "object") throw new Error("Choose a PATHETIC style draft JSON file (version 1).");
  const source = value.styles as Record<string, unknown>;
  const styles: StyleDraft["styles"] = {};
  const keys = new Set(HEADING_GROUPS.flatMap(group => group.lines.map(line => draftKey(group, line))));
  for (const key of keys) {
    const responsive = source[key];
    if (!responsive || typeof responsive !== "object") continue;
    for (const device of BREAKPOINTS) {
      const patch = (responsive as Record<string, unknown>)[device.id];
      if (!patch || typeof patch !== "object") continue;
      const clean: StylePatch = {};
      for (const field of NUMERIC_FIELDS) {
        const n = (patch as Record<string, unknown>)[field.key];
        if (typeof n === "number" && Number.isFinite(n)) clean[field.key] = Math.min(field.max, Math.max(field.min, n));
      }
      for (const field of ["color", "strokeColor"] as const) {
        const color = (patch as Record<string, unknown>)[field];
        if (typeof color === "string" && /^#[\da-f]{6}$/i.test(color)) clean[field] = color;
      }
      styles[key] ??= {};
      styles[key][device.id] = clean;
    }
  }
  return { version: 1, styles };
}
