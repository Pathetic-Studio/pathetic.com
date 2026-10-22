"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { radialRevealGradient, type RadialReveal } from "@/lib/radial-reveal";

export type HeaderVisualMode = "default" | "electric" | "matrix" | "space";

export type HeaderRadialReveal = RadialReveal;

export type HeaderVisualTheme = {
  mode: Exclude<HeaderVisualMode, "default">;
  accent?: string;
  surface?: string;
  intensity?: number;
  progress?: number;
  boundary?: number;
  priority?: number;
  radial?: HeaderRadialReveal | null;
};

type HeaderVisualClaim = Required<HeaderVisualTheme> & {
  sourceId: string;
  order: number;
};

type HeaderVisualThemeContextValue = {
  setHeaderVisualTheme: (sourceId: string, theme: HeaderVisualTheme) => void;
  updateHeaderVisualTheme: (
    sourceId: string,
    patch: Partial<HeaderVisualTheme>,
  ) => void;
  clearHeaderVisualTheme: (sourceId: string) => void;
};

const HeaderVisualThemeContext =
  createContext<HeaderVisualThemeContextValue | null>(null);

const clamp01 = (value: number | undefined, fallback: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
};

function colorChannels(value: string, fallback: [number, number, number]) {
  const clean = value.trim().replace(/^#/, "");
  const expanded =
    clean.length === 3
      ? clean
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : clean.slice(0, 6);

  if (!/^[0-9a-f]{6}$/i.test(expanded)) return fallback;
  return [
    Number.parseInt(expanded.slice(0, 2), 16),
    Number.parseInt(expanded.slice(2, 4), 16),
    Number.parseInt(expanded.slice(4, 6), 16),
  ] as [number, number, number];
}

function normaliseClaim(
  sourceId: string,
  theme: HeaderVisualTheme,
  order: number,
): HeaderVisualClaim {
  return {
    sourceId,
    mode: theme.mode,
    accent: theme.accent || (theme.mode === "matrix" ? "#00ff46" : "#7ed7ff"),
    surface: theme.surface || "#000000",
    intensity: clamp01(theme.intensity, 0.58),
    progress: clamp01(theme.progress, 1),
    boundary: clamp01(theme.boundary, 0),
    priority: theme.priority ?? 0,
    order,
    radial: theme.radial ?? null,
  };
}

function syncBoundaryToHeaderItems(header: HTMLElement, boundary: number) {
  const targets = header.querySelectorAll<HTMLElement>(
    [
      "[data-header-logo-main]",
      "[data-header-logo-effects]",
      "[data-header-logo-matrix]",
      "[data-header-feature-root]",
      "[data-header-feature-effects]",
      "[data-header-feature-image-rotator]",
      "[data-header-feature-image-native]",
      "[data-header-feature-matrix-texture]",
      "[data-header-feature-matrix-streams]",
      "[data-header-right-box]",
      "[data-right-nav-item]",
      "[data-left-nav-item]",
      "[data-header-nav-label]",
      "[data-social-nav-item]",
      "[data-header-social-matrix]",
      "[data-mobile-header-item]",
    ].join(","),
  );

  const visibleTargets = Array.from(targets)
    .map((target) => ({
      target,
      bounds: target.getBoundingClientRect(),
    }))
    .filter(({ bounds }) => bounds.width > 0 && bounds.height > 0);
  // `boundary` follows the actual section seam through the viewport. Each
  // header visual then converts that shared page-space Y into its own mask.
  // This keeps oversized artwork (the feature star) aligned with normal text.
  const edgeY = (1 - boundary) * window.innerHeight;

  visibleTargets.forEach(({ target, bounds }) => {
    const localProgress =
      bounds.height > 0
        ? Math.max(0, Math.min(1, (edgeY - bounds.top) / bounds.height))
        : 1 - boundary;
    target.style.setProperty(
      "--header-item-matrix-edge",
      `${localProgress * 100}%`,
    );
  });
}

let radialMeasurements: { header: HTMLElement; width: number; height: number; items: { target: HTMLElement; bounds: DOMRect }[] } | null = null;
function syncRadialToHeader(header: HTMLElement, radial: HeaderRadialReveal) {
  // Header geometry is fixed during this transition. Read once, then update
  // masks with the exact same oval/feather as the scene, without layout reads.
  if (!radialMeasurements || radialMeasurements.header !== header ||
    radialMeasurements.width !== innerWidth || radialMeasurements.height !== innerHeight) {
    radialMeasurements = { header, width: innerWidth, height: innerHeight, items:
      Array.from(header.querySelectorAll<HTMLElement>(
        "[data-header-logo-space], [data-header-right-box], [data-header-nav-label], [data-header-social-matrix], [data-mobile-header-role=nav]",
      )).map(target => ({ target, bounds: target.getBoundingClientRect() })) };
  }
  for (const { target, bounds } of radialMeasurements.items) {
    const x = radial.x - bounds.left, y = radial.y - bounds.top;
    target.style.setProperty("--header-space-mask", radialRevealGradient({ ...radial, x, y }, "0 0 0"));
    // CSS clamps the clip to the element's current height. Capping it to a
    // cached entrance-animation height can leave half the mobile logo black.
    target.style.setProperty("--header-space-bottom", `${Math.max(0, radial.bottom - bounds.top)}px`);
    const distance = Math.hypot((bounds.left + bounds.width / 2 - radial.x) / radial.stretchX, bounds.top + bounds.height / 2 - radial.y);
    const covered = Math.max(0, Math.min(1, (radial.radius + radial.feather - distance) / Math.max(.01, radial.feather * 2)));
    const amount = radial.bottom > bounds.top ? covered * covered * (3 - 2 * covered) : 0;
    target.style.setProperty("--header-space-ink", String(Math.round(amount * 255)));
  }
}

function applyClaimToHeader(claim: HeaderVisualClaim | null) {
  if (typeof document === "undefined") return;
  const header = document.getElementById("site-header-root");
  if (!header) return;

  if (!claim) {
    radialMeasurements = null;
    header.dataset.headerVisualMode = "default";
    delete header.dataset.headerVisualSource;
    delete header.dataset.headerMatrixExiting;
    header.style.setProperty("--header-theme-progress", "0");
    header.style.setProperty("--header-effect-intensity", "0");
    header.style.setProperty("--header-electric-opacity", "0");
    header.style.setProperty("--header-matrix-glow", "0px");
    header.style.setProperty("--header-matrix-shadow-alpha", "0");
    header.style.setProperty("--header-matrix-boundary", "0");
    header.style.setProperty("--header-matrix-edge", "100%");
    header.style.setProperty("--header-native-opacity", "1");
    header.style.setProperty("--header-boundary-icon-color", "rgb(0 0 0)");
    syncBoundaryToHeaderItems(header, 0);
    return;
  }

  header.dataset.headerVisualMode = claim.mode;
  header.dataset.headerVisualSource = claim.sourceId;
  if (claim.mode === "space" && claim.radial) {
    syncRadialToHeader(header, claim.radial);
    return;
  }
  header.dataset.headerMatrixExiting = String(claim.mode === "matrix" && claim.boundary > 0);
  header.style.setProperty("--header-theme-progress", String(claim.progress));
  header.style.setProperty("--header-effect-intensity", String(claim.intensity));
  header.style.setProperty(
    "--header-electric-opacity",
    String(0.2 + claim.intensity * 0.8),
  );
  header.style.setProperty(
    "--header-matrix-glow",
    `${claim.boundary > 0 ? 0 : claim.progress * 12}px`,
  );
  header.style.setProperty(
    "--header-matrix-shadow-alpha",
    String(claim.progress * 0.28),
  );
  header.style.setProperty(
    "--header-matrix-boundary",
    String(claim.boundary),
  );
  header.style.setProperty(
    "--header-matrix-edge",
    `${(1 - claim.boundary) * 100}%`,
  );
  syncBoundaryToHeaderItems(header, claim.boundary);
  header.style.setProperty(
    "--header-native-opacity",
    String(claim.boundary > 0 ? 1 : 1 - claim.progress),
  );
  header.style.setProperty("--header-effect-accent", claim.accent);
  header.style.setProperty("--header-effect-surface", claim.surface);
  const accentChannels = colorChannels(claim.accent, [0, 255, 70]);
  const surfaceChannels = colorChannels(claim.surface, [0, 0, 0]);
  const matrixForeground = accentChannels.map((channel) =>
    Math.round(channel * claim.progress),
  );
  header.style.setProperty(
    "--header-effect-accent-rgb",
    accentChannels.join(" "),
  );
  header.style.setProperty(
    "--header-effect-surface-rgb",
    surfaceChannels.join(" "),
  );
  header.style.setProperty(
    "--header-matrix-foreground",
    `rgb(${matrixForeground.join(" ")})`,
  );
  header.style.setProperty(
    "--header-boundary-icon-color",
    claim.boundary < 0.5
      ? `rgb(${matrixForeground.join(" ")})`
      : "rgb(0 0 0)",
  );
}

export function HeaderVisualThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const claimsRef = useRef(new Map<string, HeaderVisualClaim>());
  const orderRef = useRef(0);

  const applyActiveClaim = useCallback(() => {
    let active: HeaderVisualClaim | null = null;

    claimsRef.current.forEach((claim) => {
      if (
        !active ||
        claim.priority > active.priority ||
        (claim.priority === active.priority && claim.order > active.order)
      ) {
        active = claim;
      }
    });

    applyClaimToHeader(active);
  }, []);

  const setHeaderVisualTheme = useCallback(
    (sourceId: string, theme: HeaderVisualTheme) => {
      const existing = claimsRef.current.get(sourceId);
      const order = existing?.order ?? ++orderRef.current;
      claimsRef.current.set(sourceId, normaliseClaim(sourceId, theme, order));
      applyActiveClaim();
    },
    [applyActiveClaim],
  );

  const updateHeaderVisualTheme = useCallback(
    (sourceId: string, patch: Partial<HeaderVisualTheme>) => {
      const existing = claimsRef.current.get(sourceId);
      if (!existing) return;

      const nextTheme: HeaderVisualTheme = {
        mode: patch.mode ?? existing.mode,
        accent: patch.accent ?? existing.accent,
        surface: patch.surface ?? existing.surface,
        intensity: patch.intensity ?? existing.intensity,
        progress: patch.progress ?? existing.progress,
        boundary: patch.boundary ?? existing.boundary,
        priority: patch.priority ?? existing.priority,
      };
      claimsRef.current.set(
        sourceId,
        normaliseClaim(sourceId, nextTheme, existing.order),
      );
      applyActiveClaim();
    },
    [applyActiveClaim],
  );

  const clearHeaderVisualTheme = useCallback(
    (sourceId: string) => {
      if (!claimsRef.current.delete(sourceId)) return;
      applyActiveClaim();
    },
    [applyActiveClaim],
  );

  useEffect(
    () => () => {
      claimsRef.current.clear();
      applyClaimToHeader(null);
    },
    [],
  );

  const value = useMemo(
    () => ({
      setHeaderVisualTheme,
      updateHeaderVisualTheme,
      clearHeaderVisualTheme,
    }),
    [
      clearHeaderVisualTheme,
      setHeaderVisualTheme,
      updateHeaderVisualTheme,
    ],
  );

  return (
    <HeaderVisualThemeContext.Provider value={value}>
      {children}
    </HeaderVisualThemeContext.Provider>
  );
}

const fallbackContext: HeaderVisualThemeContextValue = {
  setHeaderVisualTheme: () => undefined,
  updateHeaderVisualTheme: () => undefined,
  clearHeaderVisualTheme: () => undefined,
};

export function useHeaderVisualTheme() {
  return useContext(HeaderVisualThemeContext) ?? fallbackContext;
}
