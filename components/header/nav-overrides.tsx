"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type NavLinkLite = {
  _key: string;
  _type?: "link";
  title?: string | null;
  linkType?: "anchor-link" | "contact" | "download" | "external" | "internal";
  buttonVariant?: string | null;
  anchorId?: string | null;
  anchorOffsetPercent?: number | null;
  [key: string]: any;
};

export type HeaderNavOverrides = {
  showDesktopRightLinks?: boolean | null;
  leftNavReplace?: NavLinkLite[] | null;
} | null;

type Ctx = {
  overrides: HeaderNavOverrides;
  setOverrides: (v: HeaderNavOverrides) => void;
};

const HeaderNavOverridesContext = createContext<Ctx | null>(null);

export function HeaderNavOverridesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [overrides, setOverrides] = useState<HeaderNavOverrides>(null);

  const value = useMemo(() => ({ overrides, setOverrides }), [overrides]);

  return (
    <HeaderNavOverridesContext.Provider value={value}>
      {children}
    </HeaderNavOverridesContext.Provider>
  );
}

export function useHeaderNavOverrides() {
  const ctx = useContext(HeaderNavOverridesContext);
  if (!ctx) {
    // If this throws, you forgot to wrap (main)/layout with HeaderNavOverridesProvider
    throw new Error("useHeaderNavOverrides must be used within HeaderNavOverridesProvider");
  }
  return ctx;
}

/**
 * Mount this on meme-booth route to apply overrides.
 * It auto-resets to null on unmount (when you navigate away).
 */
export function HeaderNavOverridesSetter({
  value,
}: {
  value: Exclude<HeaderNavOverrides, null>;
}) {
  const { setOverrides } = useHeaderNavOverrides();

  useEffect(() => {
    setOverrides(value);
    return () => setOverrides(null);
  }, [setOverrides, value]);

  return null;
}
