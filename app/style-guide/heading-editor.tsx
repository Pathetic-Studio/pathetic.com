"use client";

import { useEffect, useRef, useState } from "react";
import { HEADINGS, type Measurement } from "./specimens";
import { BREAKPOINTS, FAMILY_NAMES, HEADING_GROUPS, NUMERIC_FIELDS, draftKey, getBreakpoint, parseDraft, type StyleDraft, type StylePatch } from "./style-draft";
import styles from "./style-guide.module.css";

function hex(color: string) {
  if (color.startsWith("#")) return color;
  const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  return channels?.length === 3 ? `#${channels.map(n => Math.round(n).toString(16).padStart(2, "0")).join("")}` : "#000000";
}
export default function HeadingEditor({ draft, onDraft, width, onWidth, metrics, selected, onSelect }: {
  draft: StyleDraft; onDraft: (draft: StyleDraft) => void; width: number; onWidth: (width: number) => void;
  metrics: Record<number, Measurement[]>; selected: string; onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [lineIndex, setLineIndex] = useState(0);
  const [status, setStatus] = useState("Drafts save in this browser.");
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const panel = useRef<HTMLElement>(null);
  const upload = useRef<HTMLInputElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const group = HEADING_GROUPS.find(group => group.id === selected) || HEADING_GROUPS[0];
  const line = group.lines[Math.min(lineIndex, group.lines.length - 1)];
  const breakpoint = getBreakpoint(width);
  const key = draftKey(group, line);
  const patch = draft.styles[key]?.[breakpoint] || {};
  const current = metrics[width]?.find(row => row.id === line);
  const defaults: Required<StylePatch> = {
    font: current?.font || 60, line: current ? current.line / current.font : 1,
    x: current?.x || 1, y: current?.y || 1, tracking: current?.tracking || 0,
    maxWidth: current?.maxWidth || 0, stroke: parseFloat(current?.stroke || "0"),
    color: hex(current?.color || "#000000"), strokeColor: hex(current?.strokeColor || "#000000"),
  };
  useEffect(() => { if (innerWidth < 700) setOpen(false); }, []);
  useEffect(() => { setLineIndex(0); }, [selected]);
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("style-editor-open", show);
    return () => window.removeEventListener("style-editor-open", show);
  }, []);
  useEffect(() => {
    const reset = () => setPosition(null);
    window.addEventListener("resize", reset);
    return () => window.removeEventListener("resize", reset);
  }, []);
  function update(next: StylePatch) {
    onDraft({ version: 1, styles: { ...draft.styles, [key]: { ...draft.styles[key], [breakpoint]: { ...patch, ...next } } } });
  }
  function exportDraft() {
    const result = { ...draft, exportedAt: new Date().toISOString(), purpose: "Preview-only typography proposal. Review and implement in shared site styles.", units: { font: "CSS px before scaling", line: "unitless", x: "horizontal compression", y: "overall scale", maxWidth: "ch; 0 means no maximum", tracking: "em", stroke: "CSS px (outside stroke appearance is half this)" }, breakpoints: BREAKPOINTS, families: HEADING_GROUPS, additionalOutliers: ["Jobs: 3D title geometry; align its scene scale to the final H1 family during implementation."], referenceRules: HEADINGS.map(({ id, source, rule }) => ({ id, source, rule })), measurements: metrics };
    const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `pathetic-heading-draft-${new Date().toISOString().slice(0, 10)}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("Exported. Send this JSON file back with your notes.");
  }
  function alignFamily() {
    const responsive = { ...draft.styles[key] };
    for (const device of BREAKPOINTS) {
      const m = metrics[device.width]?.find(row => row.id === line);
      if (m) responsive[device.id] = { ...responsive[device.id], font: m.font, line: m.line / m.font, x: m.x, y: m.y, tracking: m.tracking };
    }
    onDraft({ version: 1, styles: { ...draft.styles, [key]: responsive } });
    setStatus(`Shared sizing set from ${group.name} at all three screen sizes.`);
  }
  return <>
    {!open && <button className={styles.editorLauncher} onClick={() => setOpen(true)}>Edit heading styles</button>}
    <aside ref={panel} className={styles.editor} style={{ display: open ? undefined : "none", ...(position ? { left: position.left, top: position.top, right: "auto", bottom: "auto" } : {}) }} aria-label="Heading style editor">
      <div className={styles.editorGrip} onPointerDown={event => {
        if ((event.target as HTMLElement).closest("button") || innerWidth < 700) return;
        const box = panel.current!.getBoundingClientRect();
        drag.current = { x: event.clientX, y: event.clientY, left: box.left, top: box.top };
        event.currentTarget.setPointerCapture(event.pointerId);
      }} onPointerMove={event => {
        if (!drag.current || !panel.current) return;
        setPosition({ left: Math.max(8, Math.min(innerWidth - panel.current.offsetWidth - 8, drag.current.left + event.clientX - drag.current.x)), top: Math.max(8, Math.min(innerHeight - panel.current.offsetHeight - 8, drag.current.top + event.clientY - drag.current.y)) });
      }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
        <strong>Type studio <span>LOCAL DRAFT</span></strong><button aria-label="Minimize heading editor" onClick={() => setOpen(false)}>−</button>
      </div>
      <div className={styles.editorBody}>
        <label className={styles.editorSelect}>Reference heading<select value={group.id} onChange={e => onSelect(e.target.value)}>{HEADING_GROUPS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <p className={styles.editorFamily}>{FAMILY_NAMES[group.family]}</p>
        <p className={styles.editorHint}>{group.lines.length > 1 ? "A custom composition. Edit each line while seeing the whole stack." : `Changes apply to every ${group.family.toUpperCase()} in this preview: ${HEADING_GROUPS.filter(item => item.family === group.family).map(item => item.name).join(", ")}.`}</p>
        {group.lines.length > 1 && <label className={styles.editorSelect}>Stack line<select value={line} onChange={e => setLineIndex(group.lines.indexOf(e.target.value))}>{group.lines.map(id => <option key={id} value={id}>{HEADINGS.find(h => h.id === id)!.name}</option>)}</select></label>}
        <div className={styles.editorDevices}>{BREAKPOINTS.map(device => <button key={device.id} aria-pressed={breakpoint === device.id} onClick={() => onWidth(device.width)}>{device.label}</button>)}</div>
        <p className={styles.editorHint}>{BREAKPOINTS.find(device => device.id === breakpoint)!.range} · preview {width}px</p>
        <fieldset disabled={!current} className={styles.editorFields}>{NUMERIC_FIELDS.map(field => {
          const value = Math.round((patch[field.key] ?? defaults[field.key]) * 1000) / 1000;
          return <label key={field.key} className={styles.editorField}><span>{field.label}<small>{field.unit}</small></span><input aria-label={`${field.label} slider`} type="range" min={field.min} max={field.max} step={field.step} value={value} onChange={e => update({ [field.key]: Number(e.target.value) })} /><input aria-label={field.label} type="number" min={field.min} max={field.max} step={field.step} value={value} onChange={e => { if (e.target.value !== "") update({ [field.key]: Math.min(field.max, Math.max(field.min, Number(e.target.value))) }); }} /></label>;
        })}</fieldset>
        {!current && <p className={styles.editorHint}>Measuring this viewport…</p>}
        <div className={styles.editorColors}>{(["color", "strokeColor"] as const).map(field => <label key={field}>{field === "color" ? "Fill" : "Stroke colour"}<input type="color" value={patch[field] || defaults[field]} onChange={e => update({ [field]: e.target.value })} /></label>)}</div>
        <p className={styles.editorHint}>Values are overrides for this screen range. Untouched values keep the current site rules. Outline values are CSS pixels.</p>
        {group.warning && <p className={styles.editorWarning}>Current code outlier: {group.warning}</p>}
        <div className={styles.editorActions}>
          {group.lines.length === 1 && <button onClick={alignFamily} disabled={!BREAKPOINTS.every(device => metrics[device.width]?.length)}>Align family to this heading · all sizes</button>}
          <button onClick={() => { const responsive = { ...draft.styles[key] }; delete responsive[breakpoint]; onDraft({ version: 1, styles: { ...draft.styles, [key]: responsive } }); }}>Reset this screen range</button>
          <button onClick={exportDraft} className={styles.exportButton}>Export draft</button>
          <button onClick={() => upload.current?.click()}>Import draft</button>
          <button onClick={() => { onDraft({ version: 1, styles: {} }); setStatus("All preview overrides cleared."); }}>Reset all to site styles</button>
        </div>
        <input ref={upload} hidden type="file" accept="application/json,.json" onChange={async e => {
          const file = e.target.files?.[0]; if (!file) return;
          try { onDraft(parseDraft(JSON.parse(await file.text()))); setStatus("Draft imported. Ready to keep editing."); }
          catch (error) { setStatus(error instanceof Error ? error.message : "Could not read that draft."); }
          e.target.value = "";
        }} />
        <p className={styles.editorStatus} role="status">{status}</p>
        <p className={styles.editorHint}>Preview only. Export your draft to hand it back for implementation. H1/H2/H3 are proposed visual families; existing site tags and styles stay as they are.</p>
      </div>
    </aside>
  </>;
}
