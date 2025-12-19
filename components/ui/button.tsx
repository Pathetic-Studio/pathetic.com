"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";
import ContactFormTrigger from "@/components/contact/contact-form-trigger";
import {
  buttonVariants,
  type ButtonVariantProps,
} from "@/components/ui/button-variants";

import gsap from "gsap";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";

let physicsRegistered = false;

type ParticleImage = {
  _key?: string;
  url?: string | null;
};

type CMSLink = {
  href?: string | null;
  target?: boolean | null;
  linkType?:
  | "internal"
  | "external"
  | "contact"
  | "anchor-link"
  | "download"
  | null;
  title?: string | null;

  downloadFilename?: string | null;

  particlesEnabled?: boolean | null;
  particleImages?: ParticleImage[] | null;

  backgroundImageEnabled?: boolean | null;
  backgroundImages?: ParticleImage[] | null;

  backgroundImageAnimateEnabled?: boolean | null;
  backgroundImageHoverEffect?: "squeeze" | "bloat" | "spin" | null;

  // optional (if present in your query)
  anchorId?: string | null;
  anchorOffsetPercent?: number | null;
};

function fireParticles(root: HTMLElement, images: ParticleImage[] | null | undefined) {
  if (!images || images.length === 0) return;
  if (typeof window === "undefined") return;

  if (!physicsRegistered) {
    try {
      gsap.registerPlugin(Physics2DPlugin);
      physicsRegistered = true;
    } catch {
      return;
    }
  }

  const container = root.querySelector<HTMLElement>(
    "[data-particle-container='true']"
  );
  if (!container) return;

  const validImages = images.filter((img) => !!img?.url) as { url: string }[];
  if (!validImages.length) return;

  const bursts = Math.min(12, validImages.length * 3);

  for (let i = 0; i < bursts; i++) {
    const img = validImages[Math.floor(Math.random() * validImages.length)];

    const el = document.createElement("div");
    el.className = "absolute pointer-events-none will-change-transform";
    el.style.left = "50%";
    el.style.bottom = "0";
    el.style.width = "16px";
    el.style.height = "16px";
    el.style.transform = "translateX(-50%)";
    el.style.opacity = "0";

    const inner = document.createElement("div");
    inner.style.width = "100%";
    inner.style.height = "100%";
    inner.style.backgroundImage = `url(${img.url})`;
    inner.style.backgroundSize = "contain";
    inner.style.backgroundRepeat = "no-repeat";
    inner.style.backgroundPosition = "center";

    el.appendChild(inner);
    container.appendChild(el);

    gsap.set(el, { opacity: 1, x: 0, y: 0 });

    gsap.to(el, {
      duration: gsap.utils.random(0.6, 1.4),
      physics2D: {
        velocity: gsap.utils.random(140, 230),
        angle: gsap.utils.random(-110, -70),
        gravity: 500,
      },
      rotation: gsap.utils.random(-180, 180),
      opacity: 0,
      onComplete: () => {
        if (el.parentNode) el.parentNode.removeChild(el);
      },
    });
  }
}

type BaseButtonProps = React.ComponentProps<"button"> &
  ButtonVariantProps & {
    asChild?: boolean;
  };

type LinkableButtonProps = {
  link?: CMSLink;
  href?: string;
  target?: "_blank" | "_self";
};

export type ButtonProps = BaseButtonProps & LinkableButtonProps;

function normalizeAnchorHref(raw: string) {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return trimmed;

  // already absolute
  if (trimmed.startsWith("/")) return trimmed;

  // "#id" => assume homepage
  if (trimmed.startsWith("#")) return `/${trimmed}`;

  // "who-we-are" => treat as id
  if (!trimmed.includes("#") && !trimmed.includes("/")) return `/#${trimmed}`;

  return trimmed;
}

function dispatchAnchorNavigate(anchorId: string, offsetPercent?: number | null, href?: string) {
  try {
    window.dispatchEvent(
      new CustomEvent("app:anchor-navigate", {
        detail: { anchorId, offsetPercent, href },
      })
    );
  } catch { }
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  link,
  href,
  target,
  children,
  ...props
}: ButtonProps) {
  const pathname = usePathname();

  const cmsLink = link;

  const isContactLink = cmsLink?.linkType === "contact";
  const isDownloadLink = cmsLink?.linkType === "download";
  const isAnchorLink = cmsLink?.linkType === "anchor-link";

  const hasParticles =
    !!cmsLink?.particlesEnabled &&
    !!cmsLink?.particleImages &&
    cmsLink.particleImages.length > 0;

  const hasBackgroundImage =
    !!cmsLink?.backgroundImageEnabled &&
    !!cmsLink?.backgroundImages &&
    cmsLink.backgroundImages.length > 0;

  const backgroundImageUrl =
    hasBackgroundImage &&
      cmsLink?.backgroundImages &&
      cmsLink.backgroundImages[0]?.url
      ? cmsLink.backgroundImages[0].url
      : null;

  const backgroundImageAnimateEnabled =
    hasBackgroundImage && !!cmsLink?.backgroundImageAnimateEnabled;

  const backgroundImageHoverEffect = backgroundImageAnimateEnabled
    ? cmsLink?.backgroundImageHoverEffect
    : null;

  let url = cmsLink?.href ?? href ?? undefined;

  if (url && isAnchorLink) {
    url = normalizeAnchorHref(url);
  }

  const openInNewTab =
    typeof cmsLink?.target === "boolean" ? cmsLink.target : target === "_blank";

  const content = children ?? cmsLink?.title ?? props["aria-label"] ?? "Button";

  const buttonClassName = cn(buttonVariants({ variant, size, className }));

  const hoverRef = React.useRef(false);
  const intervalRef = React.useRef<number | null>(null);
  const targetRef = React.useRef<HTMLElement | null>(null);

  const bgImageRef = React.useRef<HTMLSpanElement | null>(null);
  const hoverAnimRef = React.useRef<gsap.core.Tween | null>(null);

  const spinStateRef = React.useRef({
    hovering: false,
    currentRotation: 0,
  });

  const startBackgroundImageHoverAnim = React.useCallback(() => {
    if (!backgroundImageAnimateEnabled || !backgroundImageHoverEffect) return;
    if (!bgImageRef.current) return;
    if (typeof window === "undefined") return;

    const el = bgImageRef.current;

    if (hoverAnimRef.current) {
      hoverAnimRef.current.kill();
      hoverAnimRef.current = null;
    }

    gsap.set(el, { transformOrigin: "50% 50%" });

    switch (backgroundImageHoverEffect) {
      case "squeeze":
        hoverAnimRef.current = gsap.to(el, {
          scaleX: 0.85,
          scaleY: 1,
          duration: 0.35,
          ease: "sine.out",
        });
        break;

      case "bloat":
        hoverAnimRef.current = gsap.to(el, {
          scaleX: 1.15,
          scaleY: 1,
          duration: 0.35,
          ease: "sine.out",
        });
        break;

      case "spin": {
        spinStateRef.current.hovering = true;

        const current = gsap.getProperty(el, "rotation") as number;
        spinStateRef.current.currentRotation = Number.isFinite(current)
          ? current
          : spinStateRef.current.currentRotation;

        gsap.set(el, { rotation: spinStateRef.current.currentRotation });

        hoverAnimRef.current = gsap.to(el, {
          rotation: spinStateRef.current.currentRotation + 360,
          duration: 2,
          ease: "linear",
          repeat: -1,
          modifiers: {
            rotation: (r) => {
              const val = parseFloat(r);
              spinStateRef.current.currentRotation = val;
              return `${val}`;
            },
          },
        });
        break;
      }

      default:
        break;
    }
  }, [backgroundImageAnimateEnabled, backgroundImageHoverEffect]);

  const stopBackgroundImageHoverAnim = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const el = bgImageRef.current;
    if (!el) return;

    const wasSpin = backgroundImageHoverEffect === "spin";
    spinStateRef.current.hovering = false;

    if (hoverAnimRef.current) {
      hoverAnimRef.current.kill();
      hoverAnimRef.current = null;
    }

    if (wasSpin) {
      const current = gsap.getProperty(el, "rotation") as number;
      const rot = Number.isFinite(current)
        ? current
        : spinStateRef.current.currentRotation;

      const mod = ((rot % 360) + 360) % 360;
      const remaining = mod === 0 ? 0 : 360 - mod;
      const targetRotation = rot + remaining;

      gsap.to(el, {
        rotation: targetRotation,
        duration: Math.max(0.12, (remaining / 360) * 0.35),
        ease: "linear",
        onComplete: () => {
          spinStateRef.current.currentRotation = targetRotation;
        },
      });

      return;
    }

    gsap.to(el, {
      duration: 0.25,
      scaleX: 1,
      scaleY: 1,
      scale: 1,
      rotation: 0,
      ease: "sine.out",
    });
  }, [backgroundImageHoverEffect]);

  const handleMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
    hoverRef.current = true;
    targetRef.current = event.currentTarget as HTMLElement;

    if (hasParticles) {
      const root = targetRef.current;
      if (root) {
        fireParticles(root, cmsLink?.particleImages);

        if (intervalRef.current == null) {
          intervalRef.current = window.setInterval(() => {
            if (!hoverRef.current || !targetRef.current) return;
            fireParticles(targetRef.current, cmsLink?.particleImages);
          }, 220);
        }
      }
    }

    startBackgroundImageHoverAnim();
  };

  const handleMouseLeave = () => {
    hoverRef.current = false;

    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    stopBackgroundImageHoverAnim();
  };

  React.useEffect(() => {
    return () => {
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (hoverAnimRef.current) {
        hoverAnimRef.current.kill();
        hoverAnimRef.current = null;
      }
    };
  }, []);

  const renderInner = () => (
    <span
      data-button-root="true"
      className="relative inline-flex items-center justify-center gap-2"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {hasBackgroundImage && backgroundImageUrl && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-visible"
        >
          <span
            ref={bgImageRef}
            className="block will-change-transform"
            style={{
              backgroundImage: `url(${backgroundImageUrl})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              width: "clamp(220px, 100%, 520px)",
              height: "250px",
            }}
          />
        </span>
      )}

      <span className="relative z-20 flex items-center gap-2">{content}</span>

      {hasParticles && (
        <span
          data-particle-container="true"
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 top-0 z-10 overflow-visible"
        />
      )}
    </span>
  );

  if (isContactLink) {
    return (
      <ContactFormTrigger
        className={buttonClassName}
        label={typeof content === "string" ? content : undefined}
      >
        {renderInner()}
      </ContactFormTrigger>
    );
  }

  if (url && isDownloadLink) {
    return (
      <a
        href={url}
        className={buttonClassName}
        download={cmsLink?.downloadFilename || ""}
      >
        {renderInner()}
      </a>
    );
  }

  // ✅ Anchor links: if same page, DO NOT use Next <Link> navigation at all.
  if (url && isAnchorLink && typeof window !== "undefined") {
    const u = new URL(url, window.location.origin);
    const samePath = u.pathname === window.location.pathname;
    const hash = u.hash || "";
    const anchorId = hash.startsWith("#") ? decodeURIComponent(hash.slice(1)) : "";

    if (samePath && anchorId) {
      return (
        <button
          type="button"
          className={buttonClassName}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dispatchAnchorNavigate(
              anchorId,
              (cmsLink as any)?.anchorOffsetPercent ?? null,
              u.pathname + u.hash
            );
          }}
        >
          {renderInner()}
        </button>
      );
    }

    // Cross-page anchor: keep real navigation
    return (
      <Link
        href={url}
        scroll={false}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        className={buttonClassName}
      >
        {renderInner()}
      </Link>
    );
  }

  if (url) {
    return (
      <Link
        href={url}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        className={buttonClassName}
      >
        {renderInner()}
      </Link>
    );
  }

  const Comp = asChild ? Slot : "button";

  return (
    <Comp data-slot="button" className={buttonClassName} {...props}>
      {renderInner()}
    </Comp>
  );
}

export { Button, buttonVariants };
