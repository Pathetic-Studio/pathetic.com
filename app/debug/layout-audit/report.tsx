"use client";

import { useEffect, useState } from "react";
import { auditFindings } from "./findings";
import styles from "./report.module.css";

const STORAGE_KEY = "pathetic-layout-audit-2026-09-29";

export default function LayoutAudit() {
  const [viewport, setViewport] = useState("all");
  const [reviewed, setReviewed] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(stored)) setReviewed(stored.filter((id) => typeof id === "string"));
    } catch { /* The audit also works without browser storage. */ }
  }, []);

  const toggleReviewed = (id: string) => {
    const next = reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
    setReviewed(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Optional persistence. */ }
  };

  const findings = auditFindings.filter((finding) => viewport === "all" || finding.shots.some((shot) => String(shot.width) === viewport));

  return (
    <main className={styles.page}>
      <header>
        <h1>Layout audit / visual to-do list</h1>
        <p>29 September 2026 · Local preview · Screenshots, notes, and questions for the next pass.</p>
        <p>Open issues and design decisions for the next pass. Review marks are saved only in this browser.</p>
        <p><a href="/api/draft-mode/local?path=/" target="_blank" rel="noreferrer">Open the audited homepage ↗</a> · <a href="/api/draft-mode/local?path=/%23what-we-are" target="_blank" rel="noreferrer">What We Are ↗</a></p>
      </header>

      <details className={styles.coverage}>
        <summary>What was checked</summary>
        <p>Homepage sections, case-study index, Deel, Air, Ramp, Stream by Sandbar, Square &amp; Cash App, and jobs. Chrome viewport emulation; a physical-device check is still needed.</p>
        <p>Phone: 320 × 740 and 390 × 844. Tablet: 768 × 1024 and 1024 × 768. Desktop: 1440 px motion-preference check, plus the new What We Are section.</p>
        <p>Menus, contact/newsletter layouts, service-card scrolling, gallery next/lightbox controls, project jumps and scrolling back up, and opening the job listing were also checked on phone and portrait tablet.</p>
        <p>This is a layout and content audit. It does not validate purchases, form delivery, Instagram freshness, or production performance.</p>
      </details>

      <div className={styles.controls}>
        <label>
          Screen width{" "}
          <select value={viewport} onChange={(event) => setViewport(event.target.value)}>
            <option value="all">All sizes</option>
            <option value="320">320 px / small phone</option>
            <option value="390">390 px / phone</option>
            <option value="768">768 px / portrait tablet</option>
            <option value="1024">1024 px / landscape tablet</option>
            <option value="1440">1440 px / desktop motion check</option>
          </select>
        </label>
        <span>{findings.length} notes · {auditFindings.filter((item) => reviewed.includes(item.id)).length}/{auditFindings.length} reviewed</span>
      </div>

      <ol className={styles.list}>
        {findings.map((finding) => (
          <li key={finding.id} id={finding.id} className={styles.finding}>
            <div className={styles.findingHeader}>
              <h2>{finding.title}</h2>
              <label className={styles.review}>
                <input type="checkbox" checked={reviewed.includes(finding.id)} onChange={() => toggleReviewed(finding.id)} />
                Reviewed
              </label>
            </div>
            <p className={styles.meta}>{finding.kind} · <a href={`/api/draft-mode/local?path=${encodeURIComponent(finding.href)}`} target="_blank" rel="noreferrer">Open section ↗</a></p>
            <p>{finding.note}</p>
            {finding.question && <p><strong>To decide:</strong> {finding.question}</p>}
            <div className={styles.shots}>
              {finding.shots.filter((shot) => viewport === "all" || String(shot.width) === viewport).map((shot) => (
                <figure key={shot.src}>
                  <a href={shot.src} target="_blank" rel="noreferrer" aria-label={`Open full screenshot: ${shot.label}`}>
                    {/* Keep the original audit capture available at its exact resolution. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={shot.src} alt={shot.label} width={shot.width} height={shot.height} loading="lazy" />
                  </a>
                  <figcaption>{shot.width} × {shot.height} · {shot.label}</figcaption>
                </figure>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
