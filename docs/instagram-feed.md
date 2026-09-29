# Connect the phone screen to @pathetic

This feature reads Instagram directly. It does not write to Instagram or Sanity. Until connected, the phone shows the local snapshot and existing meme artwork in `lib/instagram/profile.ts`, not a live feed.

## One-time account connection

1. Sign in to [Meta for Developers](https://developers.facebook.com/apps/) with the account that manages PATHETIC. Create or select the studio's app and configure **Instagram API with Instagram Login**. The Instagram account must be a **Business or Creator** account; this login option does not require a linked Facebook Page. See [Meta's Instagram Login guide](https://www.postman.com/meta/instagram/folder/6raa77c/instagram-api-with-instagram-login).
2. In the app's Instagram setup, add **@pathetic** as the Instagram account/tester and accept any invitation from that account's Instagram settings. While the app is in development, the account owner must have the relevant app/tester role. Follow the app dashboard's account authorization/token-generation flow.
3. Authorize the profile/media read permission **`instagram_business_basic`**. This website does not need content publishing, messaging, comments, or insights permissions. Generate the account's access token and copy the Instagram user ID from that connection (not the username, App ID, or a Facebook Page ID). For an OAuth flow, exchange the initial short-lived token for a long-lived token using Meta's token exchange before configuring the site. Check the expiry shown by Meta.
4. Add these secrets to `.env.local` for local testing, or to the hosting provider's **Preview** environment scoped to this feature branch. Keep the token out of chat, Git, and `NEXT_PUBLIC_` variables:

   ```dotenv
   INSTAGRAM_ACCESS_TOKEN=<long-lived Instagram user token>
   INSTAGRAM_USER_ID=<numeric Instagram account ID>
   INSTAGRAM_API_VERSION=<supported version selected in the Meta app, including v>
   ```

5. Restart the local dev server after setting `.env.local`. For a hosted preview, the environment needs to be applied to a new preview deployment. No production deployment or CMS publishing is needed to test this.
6. Open `/api/instagram/profile` on that same local/preview site. A working connection returns **`"source": "instagram"`** and **`"username": "pathetic"`**. Reload the page and inspect the phone's avatar, follower count, and six recent posts. `"source": "snapshot"` means credentials are absent, invalid, expired, belong to another account, or Instagram is temporarily unavailable. After changing credentials, a previously cached response may persist until its cache interval expires.

## How it stays updated

The server caches profile counts, biography, avatar, and six recent posts for one hour and revalidates on subsequent requests. The phone reads the latest cached result when its scene mounts. This is hourly caching on demand, not a background poll or an instant webhook. Recent videos use their thumbnails. Large reach statistics, demographics, and the 50-million claim remain editorial values: this basic profile permission does not supply those insights.

Account authorization needs maintenance too. Tokens expire or can be revoked; hourly content refresh does **not** renew a token. Consult [Meta's token exchange](https://developers.facebook.com/docs/instagram-platform/reference/access_token/) and [token refresh](https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token/) for the token's current validity and renewal rules.

For unattended operation, run token renewal on the hosting platform's scheduler before expiry, store the returned token and expiry in a durable server-side secret store, and have the feed read that stored token. Monitor failures so the account owner can reconnect after revocation. An in-memory refresh or merely setting an environment variable once is insufficient for permanent operation. **A renewal scheduler and durable token store are not configured in this repository yet.** Until they are connected, renew the token in Meta and update the preview secret before the expiry shown by Meta.

## What the routes expose

`GET /api/instagram/profile` returns public display data, with an additional five-minute HTTP cache. `/api/instagram/image?id=...` serves only image IDs from the account's cached API response and approved Instagram CDN image formats, allowing those images to be drawn safely into the phone's canvas. Tokens and raw Graph errors never go to the browser. If the account cannot be read, the local snapshot remains available.
