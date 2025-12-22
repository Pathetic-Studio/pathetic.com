//components/header/nav-overrides.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type NavLinkLite = {
  _key: string;
  _type?: "link";
  title?: string | null;
  href?: string | null;
  target?: boolean | null;

  linkType?: "anchor-link" | "contact" | "download" | "external" | "internal";
  buttonVariant?: string | null;

  anchorId?: string | null;
  anchorOffsetPercent?: number | null;

  [key: string]: any;
};

export type HeaderNavOverrides =
  | {
    // Desktop
    showDesktopRightLinks?: boolean | null;
    leftNavReplace?: NavLinkLite[] | null;

    // Mobile menu
    showMobileBottomLinks?: boolean | null;
    mobileTopReplace?: NavLinkLite[] | null;
  }
  | null;

type Ctx = {
  overrides: HeaderNavOverrides;
  setOverrides: (v: HeaderNavOverrides) => void;
};

const HeaderNavOverridesContext = createContext<Ctx | null>(null);

export function HeaderNavOverridesProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<HeaderNavOverrides>(null);
  const value = useMemo(() => ({ overrides, setOverrides }), [overrides]);
  return (
    <HeaderNavOverridesContext.Provider value={value}>
      {children}
    </HeaderNavOverridesContext.Provider>
  );
}

export function useHeaderNavOverrides(): Ctx {
  const ctx = useContext(HeaderNavOverridesContext);

  // Safe fallback outside provider (e.g. not-found tree)
  const noop = useMemo(
    () => ({
      overrides: null as HeaderNavOverrides,
      setOverrides: (_v: HeaderNavOverrides) => { },
    }),
    []
  );

  return ctx ?? noop;
}

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
