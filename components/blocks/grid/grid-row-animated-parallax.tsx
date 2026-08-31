// components/blocks/grid/grid-row-animated-parallax.ts
export type GridCardParallaxConfig = {
  titleSpeed?: number;
  bodySpeed?: number;
  imageSpeed?: number;
  captionSpeed?: number;
  captionLag?: number;
  buttonSpeed?: number;
};

export const GRID_ROW_ANIMATED_PARALLAX: GridCardParallaxConfig[] = [
  // Card child #1
  {
    titleSpeed: 1,
    bodySpeed: 1,   // e.g. text <p>
    imageSpeed: 1, // image wrapper
    captionSpeed: 1,
    buttonSpeed: 1,
  },
  // Card child #2
  {
    titleSpeed: 1.05,
    bodySpeed: 1.05,   // e.g. text <p>
    imageSpeed: 1.05, // image wrapper
    captionSpeed: 1,
    buttonSpeed: 1.05,
  },
  // Card child #3
  {
    titleSpeed: 1.1,
    bodySpeed: 1.1,   // e.g. text <p>
    imageSpeed: 1.1, // image wrapper
    captionSpeed: 1,
    buttonSpeed: 1.1,
  },
];
