# Case-study first pass

This is a **local feature-branch content layer**. No Sanity documents, schemas or assets were written or published. Nothing was pushed or deployed. The existing Sanity singleton and its renderer remain available for a later CMS integration.

## Review routes

- `/case-study` — selected-work index
- `/case-study/deel` — You’re on Mute, Bless This Desk, Birthday Bakery
- `/case-study/stream-by-sandbar` — SDK launch, Universal Dictation
- `/case-study/air` — Meme Booth
- `/case-study/ramp` — Viral Creative Producer
- `/case-study/square-cash-app` — Keep It In The Neighborhood

Copy, results, media paths and ordering live in `lib/case-studies.ts`. Metrics are the supplied editorial figures, not live analytics. Each client has one page, with separate campaign sections and links for jumping to them. The Birthday Bakery credits link to Hoso Basque and Selma Kaci.

The homepage Work section uses YOM, Bless This Desk and Dictation previews, opens the corresponding full films, and links to their case studies. The Sandbar ring and Ramp object link directly to the relevant pages. “Explore all case studies” exposes the full index. Existing DoorDash and Adidas objects remain in place.

## Media behavior and budgets

All served videos are H.264 MP4, yuv420p, with the `moov` atom before the media payload (`+faststart`). Full films retain AAC audio. The homepage previews are silent, 12 seconds long, 24 fps, and total **1.35 MB**. They retain the Work section’s near-viewport loading and offscreen pausing; touch and reduced-motion layouts show posters until interaction. Previews pause while a fullscreen film is open.

Case-study players initially render only a WebP poster and a play button. The video element and its source are mounted on click. The fullscreen Work player likewise receives the full video only when opened. No Frame.io or Instagram player scripts load with the page.

| Served file (under `public/media/`)     | Duration | Size     |
| --------------------------------------- | -------- | -------- |
| `work/yom-preview.mp4`                  | 12 sec   | 0.40 MB  |
| `work/bless-this-desk-preview.mp4`      | 12 sec   | 0.73 MB  |
| `work/dictation-preview.mp4`            | 12 sec   | 0.23 MB  |
| `work/sizzle.mp4`                       | 2:03     | 20.52 MB |
| `case-studies/deel/yom.mp4`             | 0:19     | 2.68 MB  |
| `case-studies/deel/bless-this-desk.mp4` | 1:33     | 21.71 MB |
| `case-studies/deel/birthday-bakery.mp4` | 1:04     | 12.81 MB |
| `case-studies/sandbar/sdk.mp4`          | 2:07     | 13.04 MB |
| `case-studies/sandbar/dictation.mp4`    | 1:00     | 11.95 MB |

Sizes use decimal MB. The 84.07 MB total video library is **not** a page-load download. Full films are 720p, except Dictation at 1080p to preserve the product/UI detail. Images are WebP. Air uses six selected UGC screenshots; Sandbar uses two supporting stills. Video posters are reused for the index instead of downloading additional imagery.

## Sources used

- YOM: [Frame.io trailer](https://next.frame.io/share/e94ec99a-9986-45d2-9685-7df3e3c31346/view/7e9c5ce6-40bc-4b17-8459-bc6aea1cd256), `YOM Trailer_Color_V1_CC.mp4`. Downloaded its offered 720p proxy; generated a full web film, short preview and poster.
- Bless This Desk: [Louisa episode](https://f.io/NkuDyveA), `BTD_Louisa_v8.mp4`. Downloaded its offered 720p proxy; generated a full web episode, short preview and poster.
- SDK: [approved landscape final](https://f.io/eOMnnyAi), `Sandbar_Stream_FinalEdit_v17.mp4`. Downloaded its offered 720p proxy. The supplied [vertical cut](https://f.io/S8au5S3W) was accessible but is not needed for this layout.
- Dictation: [final film](https://www.dropbox.com/scl/fi/0i2p44a8ac1egbb23uyth/FINAL-Stream-Dictation.mov?rlkey=ee5wi478rfkylqlh60x1s3bql&dl=0), 68.76 MB source. Converted HEVC MOV to browser-compatible H.264 MP4.
- Dictation preview: [website loop v4](https://www.dropbox.com/scl/fi/owy5ho8egxjp3k8k259ep/sandbar-launch-landing-loop-v4.mov?rlkey=9sd4dc7o93odjyuy435phkspx&dl=0), 2.17 GB source. Only a 12-second, 640px-wide silent version is served.
- Dictation imagery: [high-resolution stills](https://www.dropbox.com/scl/fo/l49yk6qjkqyrzmed56fkj/AGb7I5ZLZTRfCvnejkPiv8I?rlkey=ji9boy74vxv8mdacfml1kg47l&dl=0). Selected a film poster, ring detail and wide set view; resized to 1600px wide.
- Sizzle: [reel V9](https://www.dropbox.com/scl/fi/akj5trfkkxqquwzbaoszr/pathetic-Sizzle-Reel-V9.mp4?rlkey=g7bdnkkwa651vegrp5fjgy6k8&dl=0), 975.87 MB source. Converted from 4K to a 720p web copy.
- Birthday Bakery: [Paris wrap](https://drive.google.com/file/d/1NmF7_vaGzRZCsVCGYHiGae3mQ4lreWmE/view), `Deel Bday V4.mp4`, 152.51 MB source. Converted to 720×1280.
- Air: [UGC gallery](https://drive.google.com/drive/folders/19pPUHbFmfFw2wGofzTo-pXprEcgslARk). Selected Google Drive files `1RU1WJGrXwidzZk0ju0GbwdO36to-E_Ds` (Air-branded starter pack) and `1i-SSAI7ZrLAunmnB7HgJw9Mab2Wee3ct` (community share).

## Access and editorial gaps

- The [Air launch folder](https://drive.google.com/drive/folders/1MEpFcY8MOcV15ZNKVKKZ2ARcKBEVH0Wf), Air story MOV, [YOM BTS folder](https://drive.google.com/drive/folders/1SRWkW_LWFxk-_RJNi5ENzQMO6NzoB2q9) and [BTD BTS folder](https://drive.google.com/drive/folders/1mNRLc0Phke-GXRpepj8VM_iXkWUMI7uV) required Google sign-in. No unrelated original-booth assets were substituted for Air.
- Mike Sunday’s Slack MP4 returned an access error. Air links to the supplied [Instagram explainer](https://www.instagram.com/p/DYBD07ksEpG/) and [live Meme Booth](https://air.inc/meme). It does not pretend that an unavailable video is playable locally.
- No campaign media links were supplied for Ramp or Square & Cash App. Those pages use the supplied copy and results, with existing Ramp card / Square brand artwork for the centered headers and index thumbnails. No campaign footage was fabricated.
- The [What’s on Your Mind share](https://f.io/FtRnbo0n) was accessible and lists 12 assets. It is reserved for a future series section; the supplied Sandbar copy covers the SDK and Dictation films.
- The optional Bless This Desk Figma graphics were not needed for this selection.

Only compressed, selected website assets are in `public/media/`. Media URLs in the application are stable local paths, not expiring Frame.io download links. Downloads and temporary tools stayed outside the repository in `/private/tmp/pathetic-case-studies` and `/private/tmp/pathetic-media-tools`; the multi-gigabyte Sizzle and loop originals were removed after conversion and verification.

## Verification

- `pnpm typecheck` and `git diff --check` pass.
- All five client routes and the index checked at 1440px and 390px: no horizontal overflow, broken local media responses or JavaScript runtime errors. Unknown case-study slugs return 404.
- No MP4 requests before interacting with a case-study player. YOM plays with audio, correct dimensions and no decode error.
- Homepage: no new MP4 requests before approaching Work; exactly the three preview files load there. Fullscreen playback works, previews pause behind it, Escape closes it, and the case-study link reaches the correct campaign.
- Touch browser: zero automatic MP4 requests in Work, with all three posters visible.
- Direct and same-page campaign links land 112px below the viewport top, clear of the fixed header. The smooth-scroll helpers now respect CSS `scroll-margin-top` while retaining explicit navigation offsets.
- Video metadata checked for H.264, AAC on full films, no audio on previews, duration and fast-start ordering.
- Temporary development server stopped after checks.

## Case-study structure and presentation

Follow the supplied **Case Studies (complete)** document: five client pages, with the campaigns grouped inside them. The overview has exactly one image/preview linking to each page. Supporting images and individual campaigns are not separate overview entries.

| Case study        | Campaigns                                        | Categories from the supplied document |
| ----------------- | ------------------------------------------------ | ------------------------------------- |
| Deel              | You’re on Mute; Bless This Desk; Birthday Bakery | Social Series; IRL Activation         |
| Stream by Sandbar | SDK Launch Film; Universal Dictation Launch Film | Product Film                          |
| Air               | Meme Booth Campaign                              | Microsite & Distribution              |
| Ramp              | Viral Creative Producer                          | Recruitment Ad                        |
| Square & Cash App | Keep It In The Neighborhood                      | IRL + Meme Campaign                   |

Client introductions and campaign copy, titles, results and categories are taken from that document. There are no added marketing headlines, margin notes or asterisks. Functional navigation and player labels remain. Client pages have centered headings, lead imagery and text. The header uses the same transparent root as the homepage.

`case-study-jumble.tsx` provides the five-image overview collection and supporting galleries. `case-study-orbit-gallery.tsx` provides the Deel gallery, with buttons, arrow keys, dragging and click-to-enlarge. Its cards slide between positions and stay upright. The shared Radix image viewer traps and restores focus and closes with Escape.

All thumbnails, hero imagery, film panels, gallery cards, result labels and controls stay upright on the index and individual case-study pages. The previous rotation wrapper and its CSS animation have been removed, along with static tilts and hover rotations. Preview videos remain interaction-only; full films load only on play.

Four additional Air screenshots were selected from the already-downloaded UGC folder: files `1-V0uelDvzaZJTSElTuq8DUFrnaKndlom`, `1dr8mQIlxX8488nDIjrJMflprJYry0IxO`, `1ikZX4xpeaEnpaZ7U-c-RANGam8iprcBu`, and `1m9MgOfxtG4AktZVw_sS9mD2Zl-uUKQmx`. Their WebP copies total 244 KB. These bring Air’s gallery to six images. Ramp uses its existing homepage card image (`573a64b7e1b8089d88f21e217940ef8bbe718068-140x133.png`); Square reuses its local wordmark. They are brand visuals, not fabricated campaign stills.

Cross-page campaign navigation aligns the requested fragment after destination content mounts, avoiding a race with the scroller’s earlier pathname effect. Previous, next and overview links preserve the original client routes. Everything remains a local feature-branch layer; the shared Sanity documents are unchanged.

Development screenshots/scripts for this correction are in `/private/tmp/pathetic-case-correction/`. Use an isolated preview copy on port 3100 when another Next server is running for this workspace, to avoid sharing `.next` build output. Stop only the temporary server started for validation.

Structure validation: client intros and all eight campaign titles, categories, results and bodies match the supplied document (normalizing typographic quotes/whitespace). The overview contains five unique destinations. Chrome checks passed for transparent navigation and image enlargement. Mobile layouts at 390px and 320px had no horizontal overflow. No initial video requests or JavaScript runtime errors were observed. `pnpm typecheck` and `git diff --check` passed. The temporary preview was stopped after validation.

Rotation-removal validation: Chrome computed-style checks confirm that the index and all five case-study pages have no rotated items, including index/gallery hover states and cards during carousel transitions. Gallery navigation and image enlargement still work. The index and Deel also passed at 390px with no horizontal overflow. No JavaScript runtime errors were observed; `pnpm typecheck` and `git diff --check` passed. The check script and gallery screenshot are in `/private/tmp/pathetic-case-upright/`.
