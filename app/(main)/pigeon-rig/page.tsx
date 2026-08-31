"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";

type WingTransform = {
  x: number;
  y: number;
  rotation: number;
  shearX: number;
  shearY: number;
  scaleX: number;
  scaleY: number;
  originX: number;
  originY: number;
};

type FrameId = "up" | "mid1" | "mid2" | "down";
type WingSide = "front" | "rear";
type FrameRig = Record<WingSide, WingTransform>;
type Rig = Record<FrameId, FrameRig>;

const FRAME_DEFINITIONS: Array<{
  id: FrameId;
  label: string;
  frontSrc: string;
  rearSrc: string;
}> = [
  {
    id: "up",
    label: "01 Up",
    frontSrc: "/images/basket-links/pigeon-wing-front.png",
    rearSrc: "/images/basket-links/pigeon-wing-back.png",
  },
  {
    id: "mid1",
    label: "02 Mid 1",
    frontSrc: "/images/basket-links/pigeon-wing-front-cycle-2.png",
    rearSrc: "/images/basket-links/pigeon-wing-back-cycle-2.png",
  },
  {
    id: "mid2",
    label: "03 Mid 2",
    frontSrc: "/images/basket-links/pigeon-wing-front-cycle-3.png",
    rearSrc: "/images/basket-links/pigeon-wing-back-cycle-3.png",
  },
  {
    id: "down",
    label: "04 Recovery",
    frontSrc: "/images/basket-links/pigeon-wing-front-cycle-4.png",
    rearSrc: "/images/basket-links/pigeon-wing-back-cycle-4.png",
  },
];

const PLAY_SEQUENCE: FrameId[] = ["up", "mid1", "mid2", "down"];

const DEFAULT_RIG: Rig = {
  up: {
    front: {
      x: -17.5,
      y: -9.5,
      rotation: 0,
      shearX: 0,
      shearY: 0,
      scaleX: 1,
      scaleY: 1,
      originX: 61,
      originY: 69.5,
    },
    rear: {
      x: 2.5,
      y: -5.5,
      rotation: 0,
      shearX: 0,
      shearY: 0,
      scaleX: 1,
      scaleY: 1,
      originX: 70,
      originY: 56,
    },
  },
  mid1: {
    front: {
      x: -35.5,
      y: -4,
      rotation: 0,
      shearX: 0,
      shearY: 0,
      scaleX: 0.65,
      scaleY: 0.65,
      originX: 79,
      originY: 64,
    },
    rear: {
      x: -4,
      y: 24,
      rotation: 0,
      shearX: 0,
      shearY: 0,
      scaleX: 0.65,
      scaleY: 0.65,
      originX: 77,
      originY: 26,
    },
  },
  mid2: {
    front: {
      x: -34,
      y: 22,
      rotation: 0,
      shearX: 0,
      shearY: 0,
      scaleX: 0.65,
      scaleY: 0.65,
      originX: 77,
      originY: 38,
    },
    rear: {
      x: -2,
      y: 23,
      rotation: 0,
      shearX: 0,
      shearY: 0,
      scaleX: 0.65,
      scaleY: 0.65,
      originX: 74,
      originY: 28,
    },
  },
  down: {
    front: {
      x: -17.5,
      y: -9.5,
      rotation: 0,
      shearX: 0,
      shearY: 0,
      scaleX: 1,
      scaleY: 1,
      originX: 61,
      originY: 69.5,
    },
    rear: {
      x: 2.5,
      y: -5.5,
      rotation: 0,
      shearX: 0,
      shearY: 0,
      scaleX: 1,
      scaleY: 1,
      originX: 70,
      originY: 56,
    },
  },
};

const TRANSFORM_FIELDS: Array<{
  key: keyof WingTransform;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}> = [
  { key: "x", label: "X", min: -100, max: 100, step: 0.5, unit: "%" },
  { key: "y", label: "Y", min: -100, max: 100, step: 0.5, unit: "%" },
  { key: "rotation", label: "Rotation", min: -180, max: 180, step: 0.5, unit: "°" },
  { key: "shearX", label: "Shear X", min: -80, max: 80, step: 0.5, unit: "°" },
  { key: "shearY", label: "Shear Y", min: -80, max: 80, step: 0.5, unit: "°" },
  { key: "scaleX", label: "Scale X", min: 0.1, max: 2.5, step: 0.01, unit: "×" },
  { key: "scaleY", label: "Scale Y", min: 0.1, max: 2.5, step: 0.01, unit: "×" },
  { key: "originX", label: "Origin X", min: 0, max: 100, step: 0.5, unit: "%" },
  { key: "originY", label: "Origin Y", min: 0, max: 100, step: 0.5, unit: "%" },
];

function transformVars(value: WingTransform) {
  return {
    xPercent: value.x,
    yPercent: value.y,
    rotation: value.rotation,
    skewX: value.shearX,
    skewY: value.shearY,
    scaleX: value.scaleX,
    scaleY: value.scaleY,
    transformOrigin: `${value.originX}% ${value.originY}%`,
  };
}

function cloneRig(rig: Rig): Rig {
  return Object.fromEntries(
    Object.entries(rig).map(([frame, wings]) => [
      frame,
      {
        front: { ...wings.front },
        rear: { ...wings.rear },
      },
    ]),
  ) as Rig;
}

function NumberControl({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid grid-cols-[5.5rem_1fr_4.75rem] items-center gap-2 text-xs font-bold uppercase">
      <span>{label}</span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-[#d7ff43]"
      />
      <span className="flex items-center border border-white/30 bg-black px-1.5 py-1 font-mono">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-w-0 flex-1 bg-transparent text-right text-white outline-none"
        />
        <span className="ml-1 text-white/45">{unit}</span>
      </span>
    </label>
  );
}

function WingControls({
  wing,
  value,
  onChange,
}: {
  wing: WingSide;
  value: WingTransform;
  onChange: (key: keyof WingTransform, value: number) => void;
}) {
  return (
    <section className="space-y-3 border-2 border-white/35 p-3">
      <h2 className="text-xl font-black uppercase">{wing} wing</h2>
      <div className="space-y-2 border border-white/20 bg-white/[0.04] p-3">
        {TRANSFORM_FIELDS.map((field) => (
          <NumberControl
            key={field.key}
            label={field.label}
            min={field.min}
            max={field.max}
            step={field.step}
            unit={field.unit}
            value={value[field.key]}
            onChange={(next) => onChange(field.key, next)}
          />
        ))}
      </div>
    </section>
  );
}

export default function PigeonRigPage() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const progressInputRef = useRef<HTMLInputElement | null>(null);
  const progressLabelRef = useRef<HTMLSpanElement | null>(null);
  const playbackFrameRef = useRef<HTMLSpanElement | null>(null);

  const [rig, setRig] = useState<Rig>(() => cloneRig(DEFAULT_RIG));
  const [selectedFrame, setSelectedFrame] = useState<FrameId>("up");
  const [frameDuration, setFrameDuration] = useState(0.09);
  const [loop, setLoop] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [onionSkin, setOnionSkin] = useState(false);
  const [copyState, setCopyState] = useState("Copy config");

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const allWings = Array.from(
      stage.querySelectorAll<HTMLElement>("[data-pigeon-frame-wing]"),
    );

    for (const frame of FRAME_DEFINITIONS) {
      for (const wing of ["rear", "front"] as const) {
        const element = stage.querySelector<HTMLElement>(
          `[data-pigeon-frame="${frame.id}"][data-pigeon-wing="${wing}"]`,
        );
        if (!element) continue;
        gsap.set(element, {
          ...transformVars(rig[frame.id][wing]),
          opacity:
            frame.id === selectedFrame ? 1 : onionSkin && !playing ? 0.14 : 0,
          visibility: "visible",
        });
      }
    }

    const timeline = gsap.timeline({
      paused: true,
      repeat: loop ? -1 : 0,
      onUpdate: () => {
        const progress = timeline.progress();
        const sequenceIndex = Math.min(
          PLAY_SEQUENCE.length - 1,
          Math.floor(progress * PLAY_SEQUENCE.length),
        );
        const activeFrame = PLAY_SEQUENCE[sequenceIndex];
        if (progressInputRef.current) {
          progressInputRef.current.value = String(progress);
        }
        if (progressLabelRef.current) {
          progressLabelRef.current.textContent = `${Math.round(progress * 100)}%`;
        }
        if (playbackFrameRef.current) {
          playbackFrameRef.current.textContent = activeFrame.toUpperCase();
        }
      },
    });

    PLAY_SEQUENCE.forEach((frameId, index) => {
      const position = index * frameDuration;
      const activeWings = allWings.filter(
        (element) => element.dataset.pigeonFrame === frameId,
      );
      timeline.set(allWings, { opacity: 0 }, position);
      timeline.set(activeWings, { opacity: 1 }, position);
    });
    timeline.to(
      {},
      { duration: frameDuration },
      (PLAY_SEQUENCE.length - 1) * frameDuration,
    );

    timelineRef.current = timeline;
    if (playing) timeline.play(0);

    return () => {
      timeline.kill();
      if (timelineRef.current === timeline) timelineRef.current = null;
    };
  }, [frameDuration, loop, onionSkin, playing, rig, selectedFrame]);

  const selectFrame = (frame: FrameId) => {
    setPlaying(false);
    setSelectedFrame(frame);
  };

  const updateTransform = (
    frame: FrameId,
    wing: WingSide,
    key: keyof WingTransform,
    value: number,
  ) => {
    setPlaying(false);
    setRig((current) => ({
      ...current,
      [frame]: {
        ...current[frame],
        [wing]: {
          ...current[frame][wing],
          [key]: value,
        },
      },
    }));
  };

  const seek = (progress: number) => {
    const timeline = timelineRef.current;
    if (!timeline) return;
    timeline.pause().progress(progress);
    const sequenceIndex = Math.min(
      PLAY_SEQUENCE.length - 1,
      Math.floor(progress * PLAY_SEQUENCE.length),
    );
    setPlaying(false);
    setSelectedFrame(PLAY_SEQUENCE[sequenceIndex]);
  };

  const resetFrame = () => {
    setPlaying(false);
    setRig((current) => ({
      ...current,
      [selectedFrame]: {
        front: { ...DEFAULT_RIG[selectedFrame].front },
        rear: { ...DEFAULT_RIG[selectedFrame].rear },
      },
    }));
  };

  const resetAll = () => {
    setPlaying(false);
    setSelectedFrame("up");
    setRig(cloneRig(DEFAULT_RIG));
  };

  const copyConfig = async () => {
    const config = JSON.stringify(
      {
        frames: rig,
        frameDuration,
        sequence: PLAY_SEQUENCE,
        loop,
      },
      null,
      2,
    );
    try {
      await navigator.clipboard.writeText(config);
      setCopyState("Copied");
    } catch {
      setCopyState("Copy failed");
    }
    window.setTimeout(() => setCopyState("Copy config"), 1200);
  };

  const selectedLabel =
    FRAME_DEFINITIONS.find((frame) => frame.id === selectedFrame)?.label ?? selectedFrame;

  return (
    <main className="min-h-screen bg-[#151515] px-4 pb-16 pt-28 text-white md:px-7">
      <header className="mx-auto mb-6 max-w-[96rem]">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d7ff43]">
          Development tool
        </p>
        <h1 className="mt-1 text-[clamp(2.4rem,6vw,6rem)] font-black uppercase leading-[0.85] tracking-[-0.055em]">
          Pigeon frame rig
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-white/65">
          Align the front and rear wing independently for all four sprite frames. Pause and choose a frame to edit it; onion skin keeps the other poses faintly visible for registration.
        </p>
      </header>

      <div className="mx-auto grid max-w-[96rem] gap-5 lg:grid-cols-[minmax(24rem,0.8fr)_minmax(34rem,1.2fr)]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative grid min-h-[31rem] place-items-center overflow-hidden border-2 border-white/35 bg-[#ecebe4]">
            <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(#111_1px,transparent_1px),linear-gradient(90deg,#111_1px,transparent_1px)] [background-size:32px_32px]" />
            <div className="absolute bottom-[10%] left-1/2 h-[38%] w-[64%] -translate-x-1/2 border-2 border-black bg-white shadow-[10px_12px_0_rgba(0,0,0,.2)]" />
            <div ref={stageRef} className="relative z-10 size-[min(82vw,28rem)]">
              {FRAME_DEFINITIONS.map((frame) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${frame.id}-rear`}
                  data-pigeon-frame-wing
                  data-pigeon-frame={frame.id}
                  data-pigeon-wing="rear"
                  src={frame.rearSrc}
                  alt=""
                  className="pointer-events-none invisible absolute inset-0 z-10 h-full w-full object-contain will-change-[opacity,transform]"
                />
              ))}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/basket-links/pigeon-body-side.png"
                alt="Pigeon rig body"
                className="pointer-events-none absolute inset-0 z-30 h-full w-full object-contain"
              />
              {FRAME_DEFINITIONS.map((frame) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${frame.id}-front`}
                  data-pigeon-frame-wing
                  data-pigeon-frame={frame.id}
                  data-pigeon-wing="front"
                  src={frame.frontSrc}
                  alt=""
                  className="pointer-events-none invisible absolute inset-0 z-40 h-full w-full object-contain will-change-[opacity,transform]"
                />
              ))}
            </div>
          </div>

          <div className="space-y-4 border-x-2 border-b-2 border-white/35 bg-black p-4">
            <div className="grid grid-cols-4 gap-1">
              {FRAME_DEFINITIONS.map((frame) => (
                <button
                  key={frame.id}
                  type="button"
                  onClick={() => selectFrame(frame.id)}
                  className={`border px-2 py-2 text-xs font-black uppercase transition-colors ${
                    selectedFrame === frame.id
                      ? "border-[#d7ff43] bg-[#d7ff43] text-black"
                      : "border-white/40 hover:border-white hover:bg-white hover:text-black"
                  }`}
                >
                  {frame.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPlaying((current) => !current)}
                className="border-2 border-white bg-white px-4 py-2 text-sm font-black uppercase text-black hover:bg-[#d7ff43]"
              >
                {playing ? "Pause" : "Play cycle"}
              </button>
              <button type="button" onClick={resetFrame} className="border-2 border-white px-4 py-2 text-sm font-black uppercase hover:bg-white hover:text-black">
                Reset frame
              </button>
              <button type="button" onClick={resetAll} className="border-2 border-white px-4 py-2 text-sm font-black uppercase hover:bg-white hover:text-black">
                Reset all
              </button>
              <button type="button" onClick={copyConfig} className="border-2 border-[#d7ff43] px-4 py-2 text-sm font-black uppercase text-[#d7ff43] hover:bg-[#d7ff43] hover:text-black">
                {copyState}
              </button>
            </div>

            <label className="grid grid-cols-[4rem_1fr_3rem] items-center gap-3 text-xs font-black uppercase">
              <span>Cycle</span>
              <input
                ref={progressInputRef}
                type="range"
                min={0}
                max={1}
                step={0.001}
                defaultValue={0}
                onInput={(event) => seek(Number(event.currentTarget.value))}
                className="accent-[#d7ff43]"
              />
              <span ref={progressLabelRef} className="text-right font-mono">0%</span>
            </label>

            <div className="grid gap-3 sm:grid-cols-3">
              <NumberControl
                label="Frame time"
                value={frameDuration}
                min={0.03}
                max={0.5}
                step={0.01}
                unit="s"
                onChange={(value) => {
                  setPlaying(false);
                  setFrameDuration(value);
                }}
              />
              <label className="flex items-center justify-between gap-3 text-xs font-black uppercase">
                Onion skin
                <input
                  type="checkbox"
                  checked={onionSkin}
                  onChange={(event) => {
                    setPlaying(false);
                    setOnionSkin(event.target.checked);
                  }}
                  className="size-5 accent-[#d7ff43]"
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-xs font-black uppercase">
                Loop
                <input
                  type="checkbox"
                  checked={loop}
                  onChange={(event) => setLoop(event.target.checked)}
                  className="size-5 accent-[#d7ff43]"
                />
              </label>
            </div>

            <p className="flex justify-between border-t border-white/20 pt-3 text-xs font-black uppercase text-white/60">
              <span>Editing: {selectedLabel}</span>
              <span>Playing: <span ref={playbackFrameRef}>UP</span></span>
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="border-2 border-[#d7ff43] bg-[#d7ff43] px-4 py-3 text-black">
            <p className="text-xs font-black uppercase tracking-[0.16em]">Selected frame</p>
            <p className="text-3xl font-black uppercase leading-none">{selectedLabel}</p>
          </div>
          <WingControls
            wing="front"
            value={rig[selectedFrame].front}
            onChange={(key, value) => updateTransform(selectedFrame, "front", key, value)}
          />
          <WingControls
            wing="rear"
            value={rig[selectedFrame].rear}
            onChange={(key, value) => updateTransform(selectedFrame, "rear", key, value)}
          />
        </div>
      </div>
    </main>
  );
}
