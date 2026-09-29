import "server-only";
import { unstable_cache } from "next/cache";
import { INSTAGRAM_SNAPSHOT, type InstagramProfile } from "./profile";

type Media = {
  id: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
};
type Account = {
  username: string;
  name?: string;
  biography?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  profile_picture_url?: string;
  media?: { data: Media[] };
};

/** Only API-supplied CDN images are eligible for the same-origin canvas proxy. */
export function isInstagramImage(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      ["cdninstagram.com", "fbcdn.net"].some((domain) =>
        url.hostname.endsWith(`.${domain}`),
      )
    );
  } catch {
    return false;
  }
}

// An account-specific server cache avoids repeated Graph calls and never exposes
// credentials in URLs, browser bundles, logs, or the public profile response.
export const readInstagram = unstable_cache(
  async () => {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    const user = process.env.INSTAGRAM_USER_ID;
    const version = process.env.INSTAGRAM_API_VERSION;
    if (
      !token ||
      !user ||
      !/^\d+$/.test(user) ||
      !version ||
      !/^v\d+\.\d+$/.test(version)
    )
      return null;
    const url = new URL(`https://graph.instagram.com/${version}/${user}`);
    url.searchParams.set(
      "fields",
      "username,name,biography,followers_count,follows_count,media_count,profile_picture_url,media.limit(6){id,media_type,media_url,thumbnail_url,permalink}",
    );
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok)
      throw new Error("Instagram profile temporarily unavailable");
    const account = (await response.json()) as Account;
    // This component always represents PATHETIC, even if the wrong account token is configured.
    if (account.username?.toLowerCase() !== "pathetic")
      throw new Error("Instagram account mismatch");
    const images: Record<string, string> = {};
    if (
      account.profile_picture_url &&
      isInstagramImage(account.profile_picture_url)
    )
      images.avatar = account.profile_picture_url;
    const media = (account.media?.data ?? []).flatMap((item) => {
      const image =
        item.media_type === "VIDEO" ? item.thumbnail_url : item.media_url;
      if (!/^\d+$/.test(item.id) || !image || !isInstagramImage(image))
        return [];
      images[item.id] = image;
      return [
        {
          id: item.id,
          image: `/api/instagram/image?id=${item.id}`,
          permalink: item.permalink,
        },
      ];
    });
    const profile: InstagramProfile = {
      ...INSTAGRAM_SNAPSHOT,
      source: "instagram",
      username: account.username,
      name: account.name || INSTAGRAM_SNAPSHOT.name,
      biography: account.biography || INSTAGRAM_SNAPSHOT.biography,
      followers: account.followers_count ?? INSTAGRAM_SNAPSHOT.followers,
      following: account.follows_count ?? INSTAGRAM_SNAPSHOT.following,
      posts: account.media_count ?? INSTAGRAM_SNAPSHOT.posts,
      avatar: images.avatar
        ? "/api/instagram/image?id=avatar"
        : INSTAGRAM_SNAPSHOT.avatar,
      media: media.length ? media : INSTAGRAM_SNAPSHOT.media,
    };
    return { profile, images };
  },
  ["pathetic-instagram-profile-v1"],
  { revalidate: 3600 },
);
