import * as React from "react";
import Link from "next/link";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import ContactFormTrigger from "@/components/contact/contact-form-trigger";

// Minimal shape of your Sanity link object that we care about here
type CMSLink = {
  href?: string | null;
  target?: boolean | null; // open in new tab
  linkType?: "internal" | "external" | "contact" | "anchor-link" | null;
  title?: string | null;
};

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans text-sm  transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-8 [&_svg]:shrink-0 ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 focus-visible:ring-4 focus-visible:outline-1 aria-invalid:focus-visible:ring-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold uppercase underline-offset-4 hover:underline",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline:
          "border border-primary bg-background uppercase underline hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        underline: "underline",
        link: "text-primary underline-offset-4 hover:underline",
        menu: "font-semibold uppercase text-primary underline-offset-4 hover:underline",
        icon: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8  px-3 has-[>svg]:px-2.5",
        lg: "h-10  px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type BaseButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

// Extra props to let Button handle links directly
type LinkableButtonProps = {
  link?: CMSLink;
  href?: string; // for non-CMS quick links
  target?: "_blank" | "_self";
};

type ButtonProps = BaseButtonProps & LinkableButtonProps;

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
  const cmsLink = link;
  const isContactLink = cmsLink?.linkType === "contact";

  // Prefer CMS link href if present, otherwise raw href prop
  const url = cmsLink?.href ?? href ?? undefined;
  const openInNewTab =
    typeof cmsLink?.target === "boolean" ? cmsLink.target : target === "_blank";

  const content =
    children ?? cmsLink?.title ?? props["aria-label"] ?? "Button";

  const buttonClassName = cn(buttonVariants({ variant, size, className }));

  // 1) CONTACT MODAL: use ContactFormTrigger and let it open the modal.
  if (isContactLink) {
    return (
      <ContactFormTrigger
        className={buttonClassName}
        label={typeof content === "string" ? content : undefined}
      >
        {content}
      </ContactFormTrigger>
    );
  }

  // 2) NORMAL LINK: render as a Next.js Link styled like a button.
  if (url) {
    return (
      <Link
        href={url}
        target={openInNewTab ? "_blank" : undefined}
        className={buttonClassName}
      >
        {content}
      </Link>
    );
  }

  // 3) DEFAULT: regular button (or Slot) with no link semantics.
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={buttonClassName}
      {...props}
    >
      {content}
    </Comp>
  );
}

export { Button, buttonVariants };
