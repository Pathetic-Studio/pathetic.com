// components/blocks/grid/grid-row-animated-parallax.ts
export type GridCardParallaxConfig = {
  titleSpeed?: number;
  bodySpeed?: number;
  imageSpeed?: number;
  captionSpeed?: number;
  buttonSpeed?: number;
};

export const GRID_ROW_ANIMATED_PARALLAX: GridCardParallaxConfig[] = [
  // Card child #1
  {
    titleSpeed: 0.95,
    bodySpeed: 0.92,   // e.g. text <p>
    imageSpeed: 1, // image wrapper
    captionSpeed: 0.95,
    buttonSpeed: 1,
  },
  // Card child #2
  {
    titleSpeed: 0.95,
    bodySpeed: 0.92,   // e.g. text <p>
    imageSpeed: 1, // image wrapper
    captionSpeed: 0.95,
    buttonSpeed: 1,
  },
  // Card child #3
  {
    titleSpeed: 0.95,
    bodySpeed: 0.92,   // e.g. text <p>
    imageSpeed: 1, // image wrapper
    captionSpeed: 0.95,
    buttonSpeed: 1,
  },
];
