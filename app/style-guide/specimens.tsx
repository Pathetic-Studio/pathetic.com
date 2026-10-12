"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import TitleText from "@/components/ui/title-text";
import caseStyles from "@/components/case-study/client-case-study.module.css";
import workStyles from "@/components/case-study/work-collection.module.css";
import areStyles from "@/components/blocks/what-we-are/what-we-are.module.css";
import universeStyles from "@/components/blocks/credibility/credibility-universe.module.css";
import introStyles from "@/components/page-loader-section.module.css";
import { JOBS_TITLE_BOUNDS, JOBS_TITLE_PATHS } from "@/components/jobs/jobs-title-paths";
import styles from "./style-guide.module.css";
import { HEADING_GROUPS, EMPTY_DRAFT, draftKey, getBreakpoint, parseDraft, type StyleDraft } from "./style-draft";

type Specimen = {
  id: string; name: string; text: ReactNode; source: string; rule: string;
  surface?: string; ink?: string; props?: Partial<ComponentProps<typeof TitleText>>;
  wrapper?: string; nativeClass?: string;
};
const tight = "[&_h2]:leading-[.78] [&_h2]:tracking-[-.045em]";
export const HEADINGS: Specimen[] = [
  { id: "intro", name: "Intro", text: "Who controls the memes controls the universe", source: "page-loader-section / TitleText · xl", rule: "Mobile clamp(40px, 12.4vw, 48px) / 60px tablet & desktop · overall scale 1.2 / 1.7 / 2.2", props: { size: "xl", maxChars: 34, className: `${introStyles.title} [&_h2]:tracking-[-.035em]` } },
  { id: "slides", name: "Memes / glasses", text: "@PATHETIC started as an Instagram page documenting culture with memes.", source: "lifecycle-slideshow / display", rule: "Mobile clamp(34px, 9.75vw, 42.4px) · then 40 / 56px · desktop line height .95", props: { size: "display", maxChars: 38, textOutline: true, outlineColor: "#fff", outlineWidth: 1.5, className: "[text-wrap:balance] max-sm:[&_h2]:!text-[clamp(2.125rem,9.75vw,2.65rem)]" } },
  { id: "work-eyebrow", name: "Homepage work subtitle", text: "We make Ads people love.", source: "what-we-do / matrix-eyebrow", rule: "clamp(20.8px, 2vw, 34.4px)", props: { size: "matrix-eyebrow", singleLine: true, className: "[&_h2]:leading-none" } },
  { id: "credibility", name: "Credibility", text: <>We work with the biggest<br />brands in the universe</>, source: "credibility-universe / headline", rule: "clamp(48px, 6.5cqw, 116px) · ≤700px: clamp(30px, 10cqw, 64px)", surface: "#080a13", wrapper: universeStyles.headline, props: { size: "what-we-do", stretchScaleX: .62, overallScale: 1, maxChars: 0, textColor: "#fff", textOutline: true, outlineColor: "#000", outlineWidth: 1.5 } },
  { id: "services", name: "What we do", text: <span className="bg-[#ff00d9] px-[.1em] pb-[.035em] pt-[.06em]">What we do</span>, source: "what-we-do-grid-section / what-we-do", rule: "clamp(52px, 6.6vw, 115.2px) · 640–1023px: clamp(88px, 10vw, 168px)", props: { size: "what-we-do", textColor: "#fff", maxChars: 12, className: "[&_h2]:leading-[.78] [&_h2]:tracking-[-.055em]" } },
  { id: "matrix-eyebrow", name: "Matrix introduction", text: "We do this with our", source: "talent-matrix-section / matrix-eyebrow", rule: "clamp(20.8px, 2vw, 34.4px) · X scale .66", surface: "#000600", props: { size: "matrix-eyebrow", textColor: "#fff", stretchScaleX: .66, className: "[&_h2]:leading-none" } },
  { id: "talent", name: "Talent", text: "Talent", source: "talent-matrix-section / matrix-talent", rule: "clamp(70.4px, 7.2vw, 116px) × 1.3", surface: "#000600", props: { size: "matrix-talent", textColor: "#fff", stretchScaleX: .66, overallScale: 1.3, className: tight } },
  { id: "matrix", name: "Matrix", text: "Matrix", source: "talent-matrix-section / matrix-matrix", rule: "clamp(80px, 8vw, 128px) × 1.38", surface: "#000600", props: { size: "matrix-matrix", textColor: "#fff", stretchScaleX: .66, overallScale: 1.38, className: "[&_h2]:leading-[.76] [&_h2]:tracking-[-.04em]" } },
  { id: "our", name: "Network · our", text: "Our", source: "network-reach / network-eyebrow", rule: "clamp(18.4px, 1.55vw, 27.2px)", surface: "#D8FF56", props: { size: "network-eyebrow", className: "[&_h2]:leading-[.84] [&_h2]:tracking-[-.04em]" } },
  { id: "unfair", name: "Network · unfair", text: "Unfair", source: "network-reach / network-lead", rule: "clamp(40px, 4.6vw, 76.8px)", surface: "#D8FF56", props: { size: "network-lead", className: "[&_h2]:leading-[.82] [&_h2]:tracking-[-.05em]" } },
  { id: "advantage", name: "Network · advantage", text: "Advantage", source: "network-reach / network-main", rule: "clamp(88px, 10vw, 168px) · <640px: 16vw", surface: "#D8FF56", props: { size: "network-main", stretchScaleX: .8, singleLine: true, className: "max-sm:[&_h2]:text-[16vw] [&_h2]:leading-[.72] [&_h2]:tracking-[-.06em]" } },
  { id: "friends", name: "And we bring friends", text: "And we bring friends", source: "network-reach / network-friends", rule: "clamp(32px, 8.9vw, 48px) · 72 / 102.4px × 1.04", surface: "#D8FF56", props: { size: "network-friends", stretchScaleX: .72, overallScale: 1.04, singleLine: true, maxChars: 0, textColor: "#fff", textOutline: true, outlineColor: "#050505", outlineWidth: 2, className: "max-sm:[&_h2]:text-[clamp(2rem,8.9vw,3rem)] [&_h2]:leading-[1.04] lg:[&_h2]:leading-[.78] [&_h2]:tracking-[-.055em]" } },
  { id: "believe", name: "What we believe", text: "What we believe", source: "grid-row-animated / belief", rule: "clamp(76px, 12vw, 172px) · heavy 3px outside stroke", surface: "#7388ff", props: { size: "belief", maxChars: 0, textColor: "#fff", textOutline: true, outlineColor: "#050505", outlineWidth: 3, className: "[&_h2]:leading-[1.02] [&_h2]:tracking-[-.01em] sm:[&_h2]:leading-[.76]" } },
  { id: "are", name: "What we are", text: "What we are", source: "what-we-are / belief + mobile override", rule: "clamp(76px, 12vw, 172px) · ≤575px: clamp(64px, 20vw, 76px)", surface: "#f7e7cb", wrapper: areStyles.title, props: { size: "belief", singleLine: true, maxChars: 0, className: "[&_h2]:leading-[1.02] [&_h2]:tracking-[-.01em] sm:[&_h2]:leading-[.76]" } },
  { id: "contact", name: "Work with us", text: "Work with us", source: "contact / contact-cta", rule: "clamp(64px, 11.8vw, 176px) · monumental 2.5px outside stroke", props: { size: "contact-cta", singleLine: true, textColor: "#fff", textOutline: true, outlineColor: "#050505", outlineWidth: 2.5, className: "[&_h2]:leading-[.78] [&_h2]:tracking-[-.055em]" } },
  { id: "work", name: "Our work · index", text: "Our work", source: "work-collection / belief + mobile override", rule: "clamp(76px, 12vw, 172px) · mobile: clamp(32px, min(12.8vw, 25vw − 46px), 76px)", wrapper: workStyles.heading, props: { as: "h1", size: "belief", singleLine: true, maxChars: 0 } },
  { id: "client", name: "Case study · client", text: "Deel", source: "client-case-study / .client", rule: "clamp(64px, 8vw, 110px) · ≤760px: clamp(56px, 13vw, 94px)", surface: "#e9e5df", nativeClass: caseStyles.client },
  { id: "project", name: "Case study · project", text: "Birthday Bakery", source: "client-case-study / .projectTitle", rule: "clamp(42px, 5.7vw, 82px) · ≤760px: clamp(32px, 7vw, 48px)", nativeClass: caseStyles.projectTitle },
  { id: "next", name: "Case study · next client", text: "Next up: Ramp", source: "client-case-study / .nextTitle", rule: "clamp(48px, 6.5vw, 94px) · ≤760px: clamp(46px, 11vw, 70px)", surface: "#d4d5d3", nativeClass: caseStyles.nextTitle },
];

export type Measurement = { id: string; font: number; stroke: string; strokeColor: string; color: string; line: number; tracking: number; maxWidth: number; x: number; y: number };
export function HeadingPreview() {
  const root = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);
  const [viewport, setViewport] = useState(1440);
  const [draft, setDraft] = useState<StyleDraft>(EMPTY_DRAFT);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== parent || event.data?.type !== "pathetic-style-draft") return;
      try { setDraft(parseDraft(event.data.draft)); } catch { /* Ignore unrelated messages. */ }
    };
    window.addEventListener("message", receive);
    parent.postMessage({ type: "pathetic-style-ready" }, location.origin);
    return () => window.removeEventListener("message", receive);
  }, []);
  useEffect(() => { window.dispatchEvent(new Event("style-draft-updated")); }, [draft]);
  useEffect(() => {
    const update = () => { setMobile(innerWidth < 640); setViewport(innerWidth); };
    update(); window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  useEffect(() => {
    if (window.parent === window) return;
    let frame = 0;
    let settledFrame = 0;
    let fallback: ReturnType<typeof setTimeout>;
    let disposed = false;
    let lastReport = "";
    let viewportWidth = innerWidth;
    document.documentElement.classList.add(styles.previewDocument);
    const reportMeasurements = () => {
      if (disposed || !root.current) return;
      clearTimeout(fallback);
      const rows: Measurement[] = [...root.current.querySelectorAll<HTMLElement>("[data-specimen-line]")].map(row => {
        const heading = row.querySelector<HTMLElement>("h1, h2, p")!;
        const css = getComputedStyle(heading);
        const inner = heading.querySelector<HTMLElement>("span[style*='scaleX']");
        const matrix = new DOMMatrix(inner ? getComputedStyle(inner).transform : css.transform);
        return { id: row.dataset.specimenLine!, font: parseFloat(css.fontSize), stroke: css.webkitTextStrokeWidth, strokeColor: css.webkitTextStrokeColor, color: css.color, line: parseFloat(css.lineHeight), tracking: parseFloat(css.letterSpacing) / parseFloat(css.fontSize) || 0, maxWidth: heading.style.maxWidth.endsWith("ch") ? parseFloat(heading.style.maxWidth) : 0, x: matrix.a, y: matrix.d };
      });
      const height = Math.ceil(root.current.getBoundingClientRect().height);
      const report = { type: "pathetic-style-metrics", width: innerWidth, height, rows };
      const signature = JSON.stringify(report);
      if (signature === lastReport) return;
      lastReport = signature;
      window.parent.postMessage(report, location.origin);
    };
    const measure = () => {
      if (disposed) return;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(settledFrame);
      clearTimeout(fallback);
      // Let TitleText's ResizeObservers commit the new line heights before
      // reporting. Intermediate heights made the preview jump back and forth.
      frame = requestAnimationFrame(() => {
        settledFrame = requestAnimationFrame(reportMeasurements);
      });
      // Offscreen iframes can have their animation frames suspended. Keep the
      // comparison probes and a preview below the fold measurable as well.
      fallback = setTimeout(reportMeasurements, 120);
    };
    const onViewportResize = () => {
      // The parent's auto-height update also fires window.resize. Only width
      // changes should restart measurement; the observer handles content size.
      if (innerWidth === viewportWidth) return;
      viewportWidth = innerWidth;
      measure();
    };
    const onDraftUpdate = () => {
      // A parent may attach after a cached frame's first report. A draft
      // handshake must return measurements even when its values are unchanged.
      lastReport = "";
      measure();
    };
    const observer = new ResizeObserver(measure);
    if (root.current) observer.observe(root.current);
    window.addEventListener("resize", onViewportResize);
    window.addEventListener("style-draft-updated", onDraftUpdate);
    document.fonts.ready.then(measure);
    const timer = setTimeout(measure, 400);
    measure();
    return () => {
      disposed = true;
      observer.disconnect();
      clearTimeout(timer);
      clearTimeout(fallback);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(settledFrame);
      window.removeEventListener("resize", onViewportResize);
      window.removeEventListener("style-draft-updated", onDraftUpdate);
      document.documentElement.classList.remove(styles.previewDocument);
    };
  }, []);
  return <div ref={root} className={styles.specimens}>{HEADING_GROUPS.map((group, index) => {
    const first = HEADINGS.find(item => item.id === group.lines[0])!;
    const select = () => parent.postMessage({ type: "pathetic-style-select", id: group.id }, location.origin);
    return <section data-specimen={group.id} key={group.id} className={styles.specimen} style={{ background: first.surface || "#fff", color: first.ink || (["#000600", "#080a13"].includes(first.surface || "") ? "#fff" : "#000") }}>
      <div className={styles.specimenMeta}><b>{String(index + 1).padStart(2, "0")} / {group.name}</b><button onClick={select}>Edit {group.lines.length > 1 ? "stack" : group.family.toUpperCase()} ↔</button></div>
      {group.warning && <p className={styles.outlier}>Current code outlier · {group.warning}</p>}
      {group.lines.length > 1 && <p className={styles.stackNote}>Custom stack · one heading composition</p>}
      <div className={`${styles.specimenType} ${group.lines.length > 1 ? styles.stackedSpecimen : ""}`}>
        {group.lines.map((id, lineIndex) => {
          const item = HEADINGS.find(item => item.id === id)!;
          const patch = draft.styles[draftKey(group, id)]?.[getBreakpoint(viewport)] || {};
          const selector = `[data-specimen-line="${id}"]`;
          const css = [patch.font !== undefined && `font-size:${patch.font}px`, patch.line !== undefined && `line-height:${patch.line}`, patch.tracking !== undefined && `letter-spacing:${patch.tracking}em`, patch.maxWidth !== undefined && `max-width:${patch.maxWidth ? `${patch.maxWidth}ch` : "none"}`, patch.stroke !== undefined && `-webkit-text-stroke-width:${patch.stroke}px`, patch.color && `color:${patch.color}`, patch.strokeColor && `-webkit-text-stroke-color:${patch.strokeColor}`].filter(Boolean).map(rule => `${rule}!important`).join(";");
          const fill = patch.color ? `color:${patch.color}!important;` : "";
          const stroke = `${patch.stroke !== undefined ? `-webkit-text-stroke-width:${patch.stroke}px!important;` : ""}${patch.strokeColor ? `-webkit-text-stroke-color:${patch.strokeColor}!important;` : ""}`;
          const nativeScale = item.nativeClass && (patch.x !== undefined || patch.y !== undefined) ? `transform:scaleX(${patch.x ?? 1}) scale(${patch.y ?? 1});transform-origin:center` : "";
          return <div key={id} data-specimen-line={id} className={`${styles.specimenWrapper} ${item.wrapper || ""}`} style={group.lines.length > 1 ? { marginTop: lineIndex ? (group.id === "matrix" ? 20 : 12) : 0 } : undefined}>
            <style>{`${selector} :is(h1,h2,p){${css};${nativeScale}} ${selector} :is(h1,h2,p)>span{${fill}${stroke}}`}</style>
            {item.nativeClass ? <h2 className={item.nativeClass}>{item.text}</h2> : <TitleText as="h2" variant="stretched" animation="none" outlinePosition="outside" {...item.props} stretchScaleX={patch.x ?? item.props?.stretchScaleX} overallScale={patch.y ?? item.props?.overallScale} singleLine={item.id === "believe" ? !mobile : item.props?.singleLine}>{item.id === "believe" && mobile ? <>What we<br />believe</> : item.text}</TitleText>}
          </div>;
        })}
      </div>
      <div className={styles.specimenRule}>{group.lines.map(id => { const item = HEADINGS.find(h => h.id === id)!; return <p key={id}>{group.lines.length > 1 && <b>{item.name}: </b>}{item.rule}</p>; })}</div>
    </section>;
  })}</div>;

}

export function JobsTitleSpecimen() {
  const [x, y, right, top] = JOBS_TITLE_BOUNDS;
  return <svg viewBox={`${x - 60} ${-top - 60} ${right - x + 120} ${top - y + 120}`} role="img" aria-label="Jobs: white face, black outline" className={styles.jobsTitle}>
    <g transform="scale(1,-1)" fill="white" stroke="#050505" strokeWidth="54" paintOrder="stroke fill" strokeLinejoin="round">{JOBS_TITLE_PATHS.map((path, index) => <path key={index} d={path.map(command => command.join(" ")).join(" ")} />)}</g>
  </svg>;
}
