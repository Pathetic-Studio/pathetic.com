"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

export type HeaderVisualMode = "default" | "electric" | "matrix";

export type HeaderVisualTheme = {
  mode: Exclude<HeaderVisualMode, "default">;
  accent?: string;
  surface?: string;
  intensity?: number;
  progress?: number;
  boundary?: number;
  priority?: number;
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
  };
}

function applyClaimToHeader(claim: HeaderVisualClaim | null) {
  if (typeof document === "undefined") return;
  const header = document.getElementById("site-header-root");
  if (!header) return;

  if (!claim) {
    header.dataset.headerVisualMode = "default";
    delete header.dataset.headerVisualSource;
    header.style.setProperty("--header-theme-progress", "0");
    header.style.setProperty("--header-effect-intensity", "0");
    header.style.setProperty("--header-electric-opacity", "0");
    header.style.setProperty("--header-matrix-glow", "0px");
    header.style.setProperty("--header-matrix-shadow-alpha", "0");
    header.style.setProperty("--header-matrix-boundary", "0");
    header.style.setProperty("--header-matrix-edge", "100%");
    header.style.setProperty("--header-native-opacity", "1");
    header.style.setProperty("--header-boundary-icon-color", "rgb(0 0 0)");
    return;
  }

  header.dataset.headerVisualMode = claim.mode;
  header.dataset.headerVisualSource = claim.sourceId;
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
