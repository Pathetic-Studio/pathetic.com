import { createClient } from "@sanity/client";

const draftId = "drafts.19106fca-b3c5-4297-8e44-c54a42a2b784";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!token) {
  throw new Error("SANITY_API_WRITE_TOKEN is required for this draft-only migration.");
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-10-31",
  token,
  useCdn: false,
});

const existing = await client.fetch(
  `*[_id == $draftId][0]{
    _id,
    "networkKeys": blocks[_key in [
      "1c005e400eb5",
      "ca4cb3e83e5d",
      "e0cfd3f93983e2f739d5344f7bf31873",
      "bd7879ed12c631c93ccb42a10c3d743e"
    ]]._key
  }`,
  { draftId },
);

if (!existing?._id) {
  throw new Error(`Draft ${draftId} was not found.`);
}

const alreadyMigrated = await client.fetch(
  `count(*[_id == $draftId][0].blocks[_type == "network-reach-section"])`,
  { draftId },
);

if (alreadyMigrated > 0) {
  await client
    .patch(draftId)
    .set({
      'blocks[_type=="network-reach-section"].orbitTilt': 48,
      'blocks[_type=="network-reach-section"].eyes[_key=="network-eye-3"].x': 28,
      'blocks[_type=="network-reach-section"].eyes[_key=="network-eye-3"].xMobile': 20,
      'blocks[_type=="network-reach-section"].eyes[_key=="network-eye-6"].x': 72,
      'blocks[_type=="network-reach-section"].eyes[_key=="network-eye-6"].xMobile': 82,
    })
    .unset([
      'blocks[_type=="network-reach-section"].friends[_key=="network-friend-5"]',
      'blocks[_type=="network-reach-section"].friends[_key=="network-friend-6"]',
      'blocks[_type=="network-reach-section"].friends[_key=="network-friend-7"]',
      'blocks[_type=="network-reach-section"].friends[_key=="network-friend-8"]',
    ])
    .commit();
  console.log("Updated the existing Network Reach draft settings and removed empty friend placeholders.");
  process.exit(0);
}

if (!existing.networkKeys?.includes("ca4cb3e83e5d")) {
  throw new Error("The original eye network block was not found; no changes made.");
}

const sourceFriendAssets = [
  "image-1a52b78a4c156f95562f334fcab1e314e0be6625-295x747-png",
  "image-92bde61c0858eb4a73e7baccb93a43ad1b805f06-229x828-png",
  "image-2d3b3d18c8ea4430d63d5e9426905ad4d1c373e8-239x747-png",
  "image-fa4febb15e8181b3be012e6f3dab7384927aeadd-258x739-png",
];

const replacement = {
  _key: "networkReach01",
  _type: "network-reach-section",
  anchor: {
    _type: "sectionAnchor",
    anchorId: "our-network",
  },
  backgroundColor: { _type: "color", hex: "#D8FF56" },
  textColor: { _type: "color", hex: "#050505" },
  eyebrow: "WE DISTRIBUTE",
  headlineLead: "OUR WORK TO",
  headlineMain: "MILLIONS",
  description:
    "@PATHETIC reaches 50+ million creatives and professionals every month through owned media.",
  enableClickToAddEyes: true,
  eyeSpawnMinScale: 0.55,
  eyeSpawnMaxScale: 1.35,
  eyes: [
    { _key: "network-eye-1", _type: "networkEye", x: 20, y: 5, size: 80, xMobile: 14, yMobile: 12, sizeMobile: 52 },
    { _key: "network-eye-2", _type: "networkEye", x: 75, y: 10, size: 100, xMobile: 85, yMobile: 14, sizeMobile: 62 },
    { _key: "network-eye-3", _type: "networkEye", x: 28, y: 45, size: 60, xMobile: 20, yMobile: 55, sizeMobile: 44 },
    { _key: "network-eye-4", _type: "networkEye", x: 80, y: 35, size: 45, xMobile: 86, yMobile: 50, sizeMobile: 38 },
    { _key: "network-eye-5", _type: "networkEye", x: 5, y: 70, size: 150, xMobile: 10, yMobile: 77, sizeMobile: 72 },
    { _key: "network-eye-6", _type: "networkEye", x: 72, y: 55, size: 75, xMobile: 82, yMobile: 74, sizeMobile: 50 },
    { _key: "network-eye-7", _type: "networkEye", x: 10, y: 40, size: 40, xMobile: 12, yMobile: 38, sizeMobile: 34 },
  ],
  brandLabel: "YOUR\nBRAND\nGOES HERE",
  orbitDuration: 28,
  orbitTilt: 48,
  reachPoints: [
    { _key: "reach-followers", _type: "networkReachPoint", value: "218,000+", label: "FOLLOWERS", angle: 270 },
    { _key: "reach-impressions", _type: "networkReachPoint", value: "50 MILLION+", label: "MONTHLY IMPRESSIONS", angle: 32 },
    { _key: "reach-shares", _type: "networkReachPoint", value: "126,000+", label: "MONTHLY SHARES", angle: 142 },
  ],
  detailStats: [
    { _key: "detail-age", _type: "networkDetailStat", title: "AGE GROUPS", value: "80% 25–44\n17% 18–24" },
    { _key: "detail-countries", _type: "networkDetailStat", title: "TOP COUNTRIES", value: "USA, UK, GERMANY, ITALY" },
    { _key: "detail-cities", _type: "networkDetailStat", title: "TOP CITIES", value: "NYC, LONDON, PARIS, BERLIN, LA" },
  ],
  friendsTitle: "AND WE BRING FRIENDS",
  friendsDescription:
    "We partner with creators to amplify creative campaigns and ownable, repeatable formats for brands to reach new audiences.",
  friends: sourceFriendAssets.map((assetId, index) => ({
    _key: `network-friend-${index + 1}`,
    _type: "networkFriend",
    name: `Friend ${index + 1}`,
    image: {
      _type: "image",
      alt: `Network creator ${index + 1}`,
      asset: { _type: "reference", _ref: assetId },
    },
  })),
};

await client
  .transaction()
  .patch(draftId, (patch) =>
    patch
      .set({ 'blocks[_key=="ca4cb3e83e5d"]': replacement })
      .unset([
        'blocks[_key=="1c005e400eb5"]',
        'blocks[_key=="e0cfd3f93983e2f739d5344f7bf31873"]',
        'blocks[_key=="bd7879ed12c631c93ccb42a10c3d743e"]',
      ]),
  )
  .commit();

console.log("Replaced the two legacy network grids with Network Reach in the homepage draft.");
