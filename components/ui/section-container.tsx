// components/ui/section-container.tsx
import type React from "react";
import { cn } from "@/lib/utils";
import { SectionPadding, ColorVariant } from "@/sanity.types";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

interface SectionContainerProps extends Omit<DivProps, "color"> {
  color?: ColorVariant | null;
  padding?: SectionPadding | null;
}

export default function SectionContainer({
  color = "background",
  padding,
  children,
  className,
  ...rest
}: SectionContainerProps) {
  return (
    <div
      {...rest} // id, style, data-*, etc.
      className={cn(
        `bg-${color} relative`,
        padding?.top ? "pt-16 xl:pt-20" : undefined,
        padding?.bottom ? "pb-16 xl:pb-20" : undefined,
        className
      )}
    >
      {children}
    </div>
  );
}
