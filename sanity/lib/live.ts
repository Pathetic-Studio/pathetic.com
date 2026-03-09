import { defineLive } from "next-sanity/live";
import { client } from "./client";
import { token } from "./token";

export const { sanityFetch, SanityLive } = defineLive({
  // Ensure internal sync-tag fetches are authenticated for private datasets.
  client: client.withConfig({ token }),
  // Required for showing draft content when the Sanity Presentation Tool is used, or to enable the Vercel Toolbar Edit Mode
  serverToken: token,
  // Required for stand-alone live previews, the token is only shared to the brwoser if it's a valid Next.js Draft Mode session
  browserToken: token,
});
