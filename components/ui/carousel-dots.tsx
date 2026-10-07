"use client";

type CarouselDotsProps = {
  label: string;
  labels: readonly string[];
  activeIndex: number;
  onSelect: (index: number) => void;
  controls: string;
  color?: string;
  className?: string;
};

export default function CarouselDots({
  label,
  labels,
  activeIndex,
  onSelect,
  controls,
  color = "#111",
  className = "",
}: CarouselDotsProps) {
  return (
    <div
      role="group"
      aria-label={label}
      data-carousel-dots
      className={`relative z-[65] mx-auto flex w-fit shrink-0 justify-center ${className}`}
      style={{ color }}
    >
      {labels.map((name, index) => (
        <button
          key={name}
          type="button"
          aria-label={`Show ${name}`}
          aria-controls={controls}
          aria-pressed={activeIndex === index}
          onClick={() => onSelect(index)}
          className="grid h-10 w-6 cursor-pointer touch-manipulation place-items-center rounded-none border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-current"
        >
          <span
            aria-hidden="true"
            className="size-2 rounded-full border border-current"
            style={{
              backgroundColor:
                activeIndex === index ? "currentColor" : "transparent",
            }}
          />
        </button>
      ))}
    </div>
  );
}
