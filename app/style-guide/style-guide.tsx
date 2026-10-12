"use client";

import { useEffect, useRef, useState } from "react";
import TitleText, { SCALE_CONFIG, SIZE_TEXT_CLASSES, type TitleTextSize } from "@/components/ui/title-text";
import { TEXT_STYLES, DISPLAY_OUTLINE_WIDTHS } from "@/components/ui/text-styles";
import { buttonVariants, type ButtonVariantProps } from "@/components/ui/button-variants";
import CarouselDots from "@/components/ui/carousel-dots";
import { CASE_STUDIES } from "@/lib/case-studies";
import areStyles from "@/components/blocks/what-we-are/what-we-are.module.css";
import caseStyles from "@/components/case-study/client-case-study.module.css";
import workStyles from "@/components/case-study/work-collection.module.css";
import { HEADINGS, JobsTitleSpecimen, type Measurement } from "./specimens";
import styles from "./style-guide.module.css";
import HeadingEditor from "./heading-editor";
import { HEADING_GROUPS, EMPTY_DRAFT, DRAFT_STORAGE, parseDraft, type StyleDraft } from "./style-draft";

const DEVICES = [{ width: 390, name: "Mobile" }, { width: 768, name: "Tablet" }, { width: 1440, name: "Desktop" }];
const PALETTE = [
  { name: "Black", value: "#000000", use: "Type, outlines, primary buttons", light: true },
  { name: "White", value: "#FFFFFF", use: "Page, buttons, reverse type" },
  { name: "Near black", value: "#050505", use: "Display strokes, scene ink", light: true },
  { name: "Network lime", value: "#D8FF56", use: "Our unfair advantage" },
  { name: "Matrix green", value: "#00FF46", use: "Matrix light and takeover" },
  { name: "Service pink", value: "#FF00D9", use: "Open service labels and cards" },
  { name: "Parchment", value: "#F7E7CB", use: "What we are panel" },
  { name: "Sky blue", value: "#7388FF", use: "What we believe glow" },
  { name: "Fun red", value: "#FF241A", use: "Glasses Fun Button", light: true },
  { name: "Galaxy", value: "#08090E", use: "Credibility scene base", light: true },
  ...CASE_STUDIES.map(study => ({ name: study.client, value: study.accent.toUpperCase(), use: "Case study panel", light: study.ink === "#ffffff" })),
];
const BUTTONS: { variant: NonNullable<ButtonVariantProps["variant"]>; label: string; note: string }[] = [
  { variant: "outline", label: "See more of our work", note: "Square CTA · 1.5px border · 20px type" },
  { variant: "default", label: "Get in touch", note: "Primary · solid black · 14px type" },
  { variant: "menu", label: "Our services", note: "Navigation · uppercase · hover underline" },
  { variant: "footer", label: "Newsletter", note: "Footer · uppercase · 20px type" },
  { variant: "link", label: "Read the story", note: "Text link · hover underline" },
  { variant: "underline", label: "Instagram", note: "Underlined text · always visible" },
  { variant: "secondary", label: "Secondary", note: "Shared UI · soft grey fill" },
  { variant: "destructive", label: "Delete", note: "Shared UI · destructive action" },
  { variant: "icon", label: "×", note: "Icon · 36 × 36px" },
];
const number = (n: number) => Math.round(n * 10) / 10;

export default function StyleGuide() {
  const [width, setWidth] = useState(1440);
  const [draft, setDraft] = useState<StyleDraft>(EMPTY_DRAFT);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [selected, setSelected] = useState("believe");
  const draftRef = useRef(draft);
  draftRef.current = draft;
  useEffect(() => {
    try { const saved = localStorage.getItem(DRAFT_STORAGE); if (saved) setDraft(parseDraft(JSON.parse(saved))); } catch { /* Storage is optional. */ }
    setDraftLoaded(true);
  }, []);
  useEffect(() => {
    if (!draftLoaded) return;
    try { localStorage.setItem(DRAFT_STORAGE, JSON.stringify(draft)); } catch { /* Export remains available when storage is blocked. */ }
    [frame.current, ...probes.current].forEach(iframe => iframe?.contentWindow?.postMessage({ type: "pathetic-style-draft", draft }, location.origin));
  }, [draft, draftLoaded]);
  const [available, setAvailable] = useState(1100);
  const [frameHeight, setFrameHeight] = useState(6200);
  const [metrics, setMetrics] = useState<Record<number, Measurement[]>>({});
  const [copied, setCopied] = useState("");
  const [stars, setStars] = useState(false);
  const [dot, setDot] = useState(0);
  const [outfit, setOutfit] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const probes = useRef<(HTMLIFrameElement | null)[]>([]);
  const selectHeading = (id: string) => {
    setSelected(id);
    const iframe = frame.current;
    const specimen = iframe?.contentDocument?.querySelector<HTMLElement>(`[data-specimen="${id}"]`);
    if (!iframe || !specimen) return;
    const bounds = iframe.getBoundingClientRect();
    const ratio = bounds.width / Number(iframe.width);
    const controls = stage.current?.previousElementSibling?.getBoundingClientRect().height || 110;
    window.scrollTo({ top: scrollY + bounds.top + specimen.offsetTop * ratio - controls - 20, behavior: "smooth" });
  };
  useEffect(() => {
    const observer = new ResizeObserver(entries => setAvailable(entries[0].contentRect.width));
    if (stage.current) observer.observe(stage.current);
    // Start at a useful real viewport on smaller screens.
    if (window.innerWidth < 700) setWidth(390);
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin) return;
      const source = [frame.current, ...probes.current].find(p => p?.contentWindow === event.source);
      if (!source) return;
      if (event.data?.type === "pathetic-style-ready") {
        source.contentWindow?.postMessage({ type: "pathetic-style-draft", draft: draftRef.current }, location.origin);
        return;
      }
      if (event.data?.type === "pathetic-style-select" && HEADING_GROUPS.some(group => group.id === event.data.id)) {
        selectHeading(event.data.id);
        window.dispatchEvent(new Event("style-editor-open"));
        return;
      }
      if (event.data?.type !== "pathetic-style-metrics") return;
      // A measurement can arrive after another slider input has already resized
      // the frame. Never apply an old width's height to the new viewport.
      if (!source || event.data.width !== Number(source.width) || !Array.isArray(event.data.rows)) return;
      setMetrics(previous => {
        const rows = event.data.rows as Measurement[];
        if (JSON.stringify(previous[event.data.width]) === JSON.stringify(rows)) return previous;
        // Keep the three comparison sizes plus the current measurement, rather
        // than retaining and copying every pixel visited during a slider drag.
        const next: Record<number, Measurement[]> = {};
        for (const device of DEVICES) {
          if (previous[device.width]) next[device.width] = previous[device.width];
        }
        const activeWidth = Number(frame.current?.width);
        if (previous[activeWidth]) next[activeWidth] = previous[activeWidth];
        next[event.data.width] = rows;
        return next;
      });
      if (source === frame.current && Number.isFinite(event.data.height) && event.data.height > 0) {
        setFrameHeight(Math.ceil(event.data.height));
      }
    };
    window.addEventListener("message", receive);
    return () => { observer.disconnect(); window.removeEventListener("message", receive); };
  }, []);
  const scale = Math.min(1, available / width);
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setCopied(value); } catch { setCopied("Select the colour code to copy it."); }
  }
  return <main className={styles.guide}>
    <HeadingEditor draft={draft} onDraft={setDraft} width={width} onWidth={setWidth} metrics={metrics} selected={selected} onSelect={selectHeading} />
    <header className={styles.masthead}>
      <a href="/" className={styles.wordmark}>PATHETIC</a>
      <span>Website reference / 01</span>
      <button onClick={() => window.print()}>Print sheet</button>
    </header>
    <div className={styles.intro}>
      <p className={styles.kicker}>The details make the thing.</p>
      <h1>THE STYLE<br /><span>SHEET.</span></h1>
      <div className={styles.introAside}><p>One place for our type, strokes, colour and buttons.</p><p>Resize the specimens, compare the current styles, then use Type Studio to try shared heading sizes. Export your draft when you are ready to hand it back.</p></div>
    </div>
    <nav aria-label="Style sheet chapters" className={styles.chapters}>
      <a href="#type">01 / Headings</a><a href="#scale">02 / Responsive scale</a><a href="#strokes">03 / Strokes</a><a href="#colour">04 / Colour</a><a href="#buttons">05 / Buttons</a><a href="#body">06 / Text & layout</a>
    </nav>
    <section id="type" className={styles.section}>
      <div className={styles.sectionHeading}><div><p className={styles.kicker}>01 / Typography</p><h2>Our big voice.</h2></div><p>Arial Narrow, stretched and uppercase. The matrix and network are grouped as custom stacks. Outlier badges identify current rules to align; the site stays unchanged while you experiment.</p></div>
      <div className={styles.fontStrip}><span>Arial Narrow <b>Regular 400</b></span><span><strong>Arial Narrow Bold 700</strong></span><span><i>Italic / Bold Italic</i></span><span>Aa Bb Cc / 0123456789</span></div>
      <div className={styles.viewportControls}>
        <div className={styles.presets}>{DEVICES.map(d => <button key={d.width} aria-pressed={width === d.width} onClick={() => setWidth(d.width)}>{d.name} <span>{d.width}</span></button>)}</div>
        <label className={styles.range}>Viewport <input aria-label="Preview viewport width" type="range" min="320" max="1920" step="1" value={width} onChange={e => setWidth(Number(e.target.value))} /><output>{width}px</output></label>
        <span className={styles.fit}>Shown at {Math.round(scale * 100)}% to fit · type values use actual pixels</span>
      </div>
      <div ref={stage} className={styles.stage}>
        <div className={styles.frameSpace} style={{ width: width * scale, height: frameHeight * scale }}>
          <iframe ref={frame} title="All site headings at the selected screen width" src="/style-guide?preview=headings" onLoad={event => event.currentTarget.contentWindow?.postMessage({ type: "pathetic-style-draft", draft: draftRef.current }, location.origin)} width={width} height={frameHeight} style={{ transform: `scale(${scale})` }} />
        </div>
      </div>
      <div className={styles.jobsRow}><div><p className={styles.kicker}>Jobs / special case</p><h3>A title made in 3D.</h3><p className={styles.editorWarning}>Current code outlier · Jobs uses scene geometry rather than the shared H1 styles. Its size needs to be aligned in the 3D scene after this draft is approved.</p><p>The same font converted to outlines: white face, black stroke, solid black backing. It scales with the scene camera rather than a CSS font size. Front-face preview shown here.</p><code>Height 1.4 · depth .18 · bevel .025 scene units</code></div><JobsTitleSpecimen /></div>
    </section>
    <section id="scale" className={styles.section}>
      <div className={styles.sectionHeading}><div><p className={styles.kicker}>02 / Responsive scale</p><h2>Small screen. Same voice.</h2></div><p>Measured from the actual headings at each width. First number: CSS font size. Second: size after vertical scaling. The X column shows horizontal compression at your selected viewport.</p></div>
      <div className={styles.tableScroll}><table><caption>Heading sizing in pixels. Mobile 390 / tablet 768 / desktop 1440.</caption><thead><tr><th>Heading</th>{DEVICES.map(d => <th key={d.width}>{d.name}<small>{d.width}px viewport</small></th>)}<th>At {width}px<small>X scale / CSS stroke</small></th></tr></thead><tbody>{HEADING_GROUPS.map(group => <tr key={group.id}><th><button className={styles.tableEdit} onClick={() => { selectHeading(group.id); window.dispatchEvent(new Event("style-editor-open")); }}>{group.name}</button><small>{group.lines.length > 1 ? "Custom stack" : `Proposed ${group.family.toUpperCase()} family`}</small>{group.warning && <small className={styles.tableWarning}>⚠ Current code outlier</small>}</th>{DEVICES.map(device => <td key={device.width}>{group.lines.map(id => { const m = metrics[device.width]?.find(row => row.id === id); return <div key={id}>{group.lines.length > 1 && <small>{HEADINGS.find(h => h.id === id)!.name}</small>}{m ? <>{number(m.font)} <span>→ {number(m.font * m.y)}</span></> : "Measuring…"}</div>; })}</td>)}<td>{group.lines.map(id => { const m = metrics[width]?.find(row => row.id === id); return <div key={id}>{group.lines.length > 1 && <small>{HEADINGS.find(h => h.id === id)!.name}</small>}{m ? `${number(m.x)}× / ${m.stroke}` : "—"}</div>; })}</td></tr>)}</tbody></table></div>
      <details className={styles.details}><summary>Shared heading presets — including styles available beyond the homepage</summary><div className={styles.tokenGrid}>{(Object.keys(SIZE_TEXT_CLASSES) as TitleTextSize[]).map(size => <article key={size}><h3>{size}</h3><code>{SIZE_TEXT_CLASSES[size]}</code><p>X compression {DEVICES.map((d, i) => SCALE_CONFIG[size][i === 0 ? "mobile" : i === 1 ? "tablet" : "desktop"].stretchScaleX).join(" / ")}</p><p>Overall scale {DEVICES.map((d, i) => SCALE_CONFIG[size][i === 0 ? "mobile" : i === 1 ? "tablet" : "desktop"].overallScale).join(" / ")}</p></article>)}</div></details>
    </section>
    <section id="strokes" className={styles.section}>
      <div className={styles.sectionHeading}><div><p className={styles.kicker}>03 / Outlines</p><h2>Give it an edge.</h2></div><p>Outside strokes are painted behind the letter fill. A 2px outside stroke uses 4px CSS text-stroke, with half covered by the fill. Compression also changes the apparent horizontal thickness.</p></div>
      <div className={styles.strokeGrid}>{Object.entries(DISPLAY_OUTLINE_WIDTHS).map(([name, value]) => <article key={name}><TitleText variant="stretched" size="display" maxChars={0} textColor="#fff" textOutline outlineColor="#050505" outlineWidth={value} outlinePosition="outside">Pathetic</TitleText><h3>{name} / {value}px</h3><p>CSS stroke {value * 2}px · outside</p></article>)}</div>
      <div className={styles.borderSamples}><span style={{ borderWidth: 1 }}>Nav, filter & panels / 1px</span><span style={{ borderWidth: 1.5 }}>Outline button / 1.5px</span><span style={{ borderWidth: 2 }}>Focus outline / 2px</span></div>
    </section>
    <section id="colour" className={styles.section}>
      <div className={styles.sectionHeading}><div><p className={styles.kicker}>04 / Colour</p><h2>A little loud.</h2></div><p>Core colours, section accents and client panels. Click a swatch to copy its hex. These are the code-defined colours; content-managed sections can override their colours.</p></div>
      <div className={styles.palette}>{PALETTE.map(c => <button key={c.name} className={styles.swatch} onClick={() => copy(c.value)} aria-label={`Copy ${c.name}: ${c.value}`}><span className={styles.swatchPaint} style={{ background: c.value, color: c.light ? "#fff" : "#000" }}><b>Aa</b><code>{copied === c.value ? "Copied" : c.value}</code></span><strong>{c.name}</strong><span>{c.use}</span></button>)}</div>
      <p className={styles.copyStatus} role="status">{copied ? copied.startsWith("#") ? `${copied} copied to clipboard.` : copied : "Select a colour to copy its value."}</p>
      <details className={styles.details}><summary>Shared UI colour tokens</summary><div className={styles.uiTokens}>{["background", "foreground", "primary", "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground", "accent", "accent-foreground", "destructive", "border", "input", "ring", "card", "popover"].map(token => <div key={token}><span style={{ background: `var(--${token})` }} /><code>--{token}</code></div>)}</div></details>
    </section>
    <section id="buttons" className={styles.section}>
      <div className={styles.sectionHeading}><div><p className={styles.kicker}>05 / Buttons & controls</p><h2>Go on. Press it.</h2></div><p>Live shared styles, including hover, keyboard focus and disabled states. Square corners throughout the primary UI; the Fun Button and star are scene-specific exceptions.</p></div>
      <div className={styles.buttonGrid}>{BUTTONS.map(b => <article key={b.variant}><div className={styles.buttonStage}><button aria-label={b.variant === "icon" ? "Close example" : undefined} className={buttonVariants({ variant: b.variant, size: b.variant === "icon" ? "icon" : "default" })}>{b.label}</button></div><h3>{b.variant}</h3><p>{b.note}</p></article>)}</div>
      <div className={styles.controlRow}><div><h3>Button sizes</h3><div className={styles.buttonSizes}>{(["sm", "default", "lg"] as const).map(size => <button key={size} className={buttonVariants({ variant: "outline", size })}>{size === "sm" ? "Small / 32px" : size === "lg" ? "Large / 40px" : "Default / 36px"}</button>)}</div></div><div><h3>Disabled</h3><button disabled className={buttonVariants({ variant: "outline" })}>Unavailable</button><p>50% opacity · no pointer events</p></div></div>
      <div className={styles.buttonGrid}>
        <article><div className={styles.buttonStage}><button className="flex h-20 w-20 items-center justify-center rounded-full bg-[#ff241a] px-3 text-center text-[10px] font-bold uppercase leading-[.95] text-white hover:brightness-95 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4 lg:h-28 lg:w-28 lg:text-xs">Fun Button</button></div><h3>Glasses / Fun Button</h3><p>80px circle · desktop 112px</p></article>
        <article><div className={styles.buttonStage}><select aria-label="Example work filter" className={workStyles.filter}><option>All</option><option>Clients</option><option>Projects</option></select></div><h3>Work filter</h3><p>108 × 34px · 1px outline · sharp corners</p></article>
        <article><div className={`${styles.buttonStage} ${caseStyles.projectNav}`} style={{ "--study-accent": "#e9e5df", "--study-ink": "#171717" } as React.CSSProperties}><a href="#buttons" onClick={e => e.preventDefault()}>You’re on Mute</a></div><h3>Case study / jump link</h3><p>1px outline · client colour · inverse hover</p></article>
        <article><div className={styles.buttonStage}><button aria-label="Toggle star example" aria-pressed={stars} className={workStyles.toggle} onClick={() => setStars(s => !s)}><svg viewBox="0 0 214.198 110.082" fill="currentColor" aria-hidden="true"><path d="M107.099 0L132.382 42.0475H214.198L148.007 68.0342L173.29 110.082L107.099 84.095L40.9082 110.082L66.1908 68.0342L0 42.0475H81.8164L107.099 0Z" /></svg></button></div><h3>Rotating star</h3><p>Work mode toggle · selected / unselected</p></article>
        <article><div className={`${styles.buttonStage} ${areStyles.outfitCard} ${areStyles.corner}`} data-selected={outfit} data-active={outfit} style={{ position: "relative", inset: "auto", width: "100%" }}><button aria-pressed={outfit} className={areStyles.label} onClick={() => setOutfit(active => !active)}>Students of the internet</button></div><h3>What we are / label</h3><p>2px outline · responsive type · tap to select</p></article>
        <article><div className={styles.buttonStage}><CarouselDots label="Example section slides" labels={["one", "two", "three", "four"]} activeIndex={dot} onSelect={setDot} controls="example-dot-content" color="#ff00d9" /></div><h3>Section carousel dots</h3><p id="example-dot-content" aria-live="polite">Slide {dot + 1} of 4 · 8px dots · 24 × 40px tap area</p></article>
      </div>
    </section>
    <section id="body" className={styles.section}>
      <div className={styles.sectionHeading}><div><p className={styles.kicker}>06 / Supporting type & layout</p><h2>The small stuff.</h2></div><p>Shared body copy, captions and labels. Use these roles below the display headings. The specimens below respond to your actual browser width.</p></div>
      <div className={styles.bodySamples}>{Object.entries(TEXT_STYLES).map(([role, classes]) => <article key={role}><div><h3>{role}</h3><code>{classes}</code></div><p className={classes}>{["body", "bodyLarge", "sectionBody", "bodyCompact"].includes(role) ? "A network of the world’s best creatives who bring our ideas to life." : "We take our unserious work seriously."}</p></article>)}</div>
      <div className={styles.layoutGrid}><article><h3>Screen-size rules</h3><p>CSS: sm 640px / md 768px / lg 1024px / xl 1280px.</p><p>Stretched headings: mobile &lt;768px / tablet 768–1023px / desktop ≥1024px. Individual section overrides are shown above.</p></article><article><h3>Section heights</h3><p>Full: <code>100dvh</code></p><p>Cropped: <code>(100svh − nav height) × 1.1</code></p><p>Mobile section gap: <code>3rem / 48px</code>. Nav height starts at 82px and is updated to match the header.</p></article><article><h3>Copy widths</h3><p>Section body: max 36rem / 576px.</p><p>Body: max 42rem / 672px.</p><p>Compact body: max 32rem / 512px.</p><p>Responsive widths use 84–88vw before these caps.</p></article></div>
    </section>
    <footer className={styles.end}><strong>PATHETIC</strong><span>Style sheet / local reference</span><a href="#">Back to top</a></footer>
    <div className={styles.probes} aria-hidden="true">{DEVICES.map((d, i) => <iframe key={d.width} ref={node => { probes.current[i] = node; }} tabIndex={-1} title={`${d.width}px measurement only`} src="/style-guide?preview=measure" onLoad={event => event.currentTarget.contentWindow?.postMessage({ type: "pathetic-style-draft", draft: draftRef.current }, location.origin)} width={d.width} height="6500" />)}</div>
  </main>;
}
