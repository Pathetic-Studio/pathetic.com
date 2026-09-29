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
  media: Array.from({ length: 6 }, (_, i) => ({
    id: `local-${i + 1}`,
    image: `/starter-pack-refs/ref-${i + 1}.webp`,
  })),
};
