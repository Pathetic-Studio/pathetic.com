/** Code-local snapshot; these values do not write back to Instagram or Sanity. */
export type InstagramProfile = {
  source: "snapshot" | "instagram";
  username: string;
  name: string;
  biography: string;
  followers: number;
  following: number;
  posts: number;
  avatar: string;
  media: Array<{ id: string; image: string; permalink?: string }>;
};

export const INSTAGRAM_SNAPSHOT: InstagramProfile = {
  source: "snapshot",
  username: "pathetic",
  name: "PATHETIC",
  biography: "creative studio and meme page\ncatty@pathetic.com\nNYC",
  followers: 293000,
  following: 1640,
  posts: 635,
  avatar: "/images/network/profile-logo.svg",
  // Static capture of the public feed on 6 October 2026. Local files avoid
  // expiring Instagram CDN URLs and keep the phone independent of API access.
  media: Array.from({ length: 6 }, (_, i) => ({
    id: `snapshot-2026-10-06-${i + 1}`,
    image: `/images/network/posts/2026-10-06-${i + 1}.webp`,
  })),
};
