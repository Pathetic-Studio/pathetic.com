import LogoAnimated from "@/components/logo-animated";

const MATRIX_ROWS = [
  "01001101011010010100110101101001",
  "10110010100101101011001010010110",
  "00101101011100100101101001110010",
  "11010010100011011101001010001101",
  "01101100101001010110110010100101",
  "10010111001011001001011100101100",
  "00110100110101100011010011010110",
  "11001011001010011100101100101001",
  "01011010010110100101101001011010",
  "10100101101001011010010110100101",
  "01110010110100100111001011010010",
  "10001101001011011000110100101101",
];

export function HeaderLogoVisualEffects() {
  return (
    <span
      data-header-logo-effects
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 h-[92px] w-[220px] -translate-x-1/2 -translate-y-1/2"
    >
      <span
        data-header-logo-electric-aura
        className="absolute left-1/2 top-1/2 flex h-8 w-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center"
      >
        <LogoAnimated className="h-8 w-auto" />
      </span>
      <span
        data-header-logo-matrix
        className="absolute left-1/2 top-1/2 flex h-8 w-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center text-[var(--header-effect-accent)]"
      >
        <LogoAnimated className="h-8 w-auto" />
        <span data-header-logo-matrix-scan className="absolute inset-0" />
      </span>
    </span>
  );
}

export function HeaderFeatureVisualEffects() {
  return (
    <span
      data-header-feature-effects
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-[180px] w-[280px] -translate-x-1/2 -translate-y-1/2 text-[var(--header-effect-accent)]"
    >
      <span data-header-feature-matrix-streams className="absolute inset-0 overflow-hidden font-mono text-[8px] font-bold leading-[0.92]">
        {MATRIX_ROWS.slice(0, 8).map((row, index) => (
          <span
            key={`${row}-${index}`}
            className="block whitespace-nowrap"
            style={{ animationDelay: `${index * -0.11}s` }}
          >
            {row}
          </span>
        ))}
      </span>
    </span>
  );
}

export function HeaderFeatureMatrixTexture({ imageUrl }: { imageUrl: string }) {
  return (
    <span
      data-header-feature-matrix-texture
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[var(--header-effect-accent)]"
      style={{
        maskImage: `url("${imageUrl}")`,
        WebkitMaskImage: `url("${imageUrl}")`,
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
  );
}
