import { createClient } from "@sanity/client";

const draftId = "drafts.19106fca-b3c5-4297-8e44-c54a42a2b784";
const publishedId = draftId.replace(/^drafts\./, "");
const philosophyKey = "eafb7f1980c3";
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
  perspective: "raw",
});

const [draftBefore, publishedBefore] = await Promise.all([
  client.fetch(`*[_id == $draftId][0]{_id,_rev,title,blocks}`, { draftId }),
  client.fetch(`*[_id == $publishedId][0]{_id,_rev}`, { publishedId }),
]);

if (!draftBefore?._id || !Array.isArray(draftBefore.blocks)) {
  throw new Error(`Homepage draft ${draftId} was not found; no changes made.`);
}

const philosophyIndex = draftBefore.blocks.findIndex(
  (block) => block?._key === philosophyKey && block?._type === "belief-section",
);

if (philosophyIndex < 0) {
  throw new Error(`Philosophy block ${philosophyKey} was not found; no changes made.`);
}

const oldFooter = draftBefore.blocks.find((block) => block?._type === "footer");
const privacyLink = oldFooter?.footerLeftLinks?.find((link) =>
  String(link?.title || "").toLowerCase().includes("privacy"),
);

const projectCta = {
  _key: "projectCta01",
  _type: "project-cta-section",
  anchor: { _type: "sectionAnchor", anchorId: "work-with-us" },
  title: "WORK WITH US",
  buttonLabel: "START A PROJECT",
  panelColor: { _type: "color", hex: "#93A7FF" },
  textColor: { _type: "color", hex: "#FFFFFF" },
  outlineColor: { _type: "color", hex: "#050505" },
  accentColor: { _type: "color", hex: "#FF241A" },
  sparklesEnabled: true,
};

const basketItems = [
  { _key: "computer", _type: "basketLinkItem", title: "Computer", localAsset: "computer", size: 24, startX: 69, startY: 57 },
  { _key: "black-object", _type: "basketLinkItem", title: "Basket item", localAsset: "object-black", size: 18, startX: 29, startY: 30 },
  { _key: "magazine", _type: "basketLinkItem", title: "Magazine", localAsset: "magazine", size: 18, startX: 76, startY: 28 },
  { _key: "portal", _type: "basketLinkItem", title: "Portal", localAsset: "portal", size: 25, startX: 43, startY: 64 },
  { _key: "smoothie", _type: "basketLinkItem", title: "Smoothie", localAsset: "smoothie", size: 14, startX: 53, startY: 30 },
  { _key: "hoodie", _type: "basketLinkItem", title: "Hoodie", localAsset: "hoodie", size: 21, startX: 27, startY: 66 },
  { _key: "pigeon", _type: "basketLinkItem", title: "Pigeon", localAsset: "pigeon", size: 21, startX: 37, startY: 38 },
];

const basketLinks = {
  _key: "basketLinks01",
  _type: "basket-links-section",
  anchor: { _type: "sectionAnchor", anchorId: "basket-links" },
  title: "THE PATHETIC BASKET",
  hint: "(PSSSST — YOU HAVE TO CLICK ON IT)",
  backgroundColor: { _type: "color", hex: "#FFFFFF" },
  items: basketItems,
};

const bingoFooter = {
  _key: "bingoFooter01",
  _type: "bingo-footer",
  backgroundColor: { _type: "color", hex: "#FFFFFF" },
  textColor: { _type: "color", hex: "#050505" },
  leftCells: [
    { _key: "newsletter", _type: "bingoFooterCell", label: "NEWS\nLETTER", action: "newsletter", icon: "none", column: 3, row: 1 },
    {
      _key: "privacy",
      _type: "bingoFooterCell",
      label: "PRIVACY\nPOLICY",
      action: privacyLink ? "link" : "none",
      icon: "none",
      column: 2,
      row: 2,
      ...(privacyLink ? { link: { ...privacyLink, _key: "privacy-link" } } : {}),
    },
    { _key: "work", _type: "bingoFooterCell", label: "WORK", action: "none", icon: "none", column: 1, row: 4 },
    { _key: "talent", _type: "bingoFooterCell", label: "TALENT\nMATRIX", action: "none", icon: "none", column: 3, row: 4 },
  ],
  rightCells: [
    { _key: "insta", _type: "bingoFooterCell", label: "INSTA", action: "none", icon: "none", column: 1, row: 1 },
    { _key: "contact", _type: "bingoFooterCell", label: "CONTACT", action: "contact", icon: "none", column: 3, row: 1 },
    { _key: "shop", _type: "bingoFooterCell", label: "SHOP", action: "none", icon: "none", column: 1, row: 3 },
    { _key: "star", _type: "bingoFooterCell", label: "", action: "none", icon: "star", column: 1, row: 4 },
    { _key: "careers", _type: "bingoFooterCell", label: "CAREERS", action: "none", icon: "none", column: 3, row: 4 },
  ],
};

const closingTypes = new Set([
  "project-cta-section",
  "basket-links-section",
  "bingo-footer",
]);

const nextBlocks = draftBefore.blocks.filter(
  (block) => !closingTypes.has(block?._type) && block?._type !== "footer",
);
const nextPhilosophyIndex = nextBlocks.findIndex(
  (block) => block?._key === philosophyKey,
);
nextBlocks.splice(nextPhilosophyIndex + 1, 0, projectCta, basketLinks, bingoFooter);

await client
  .patch(draftId)
  .ifRevisionId(draftBefore._rev)
  .set({ blocks: nextBlocks })
  .commit();

const [draftAfter, publishedAfter] = await Promise.all([
  client.fetch(
    `*[_id == $draftId][0]{_id,_rev,"blocks":blocks[]{_key,_type}}`,
    { draftId },
  ),
  client.fetch(`*[_id == $publishedId][0]{_id,_rev}`, { publishedId }),
]);

if (publishedBefore?._rev !== publishedAfter?._rev) {
  throw new Error("Published homepage revision changed during the draft migration; inspect Sanity immediately.");
}

const inserted = draftAfter?.blocks?.filter((block) => closingTypes.has(block?._type));
if (inserted?.length !== 3) {
  throw new Error("Draft verification failed: expected all three closing blocks.");
}

console.log(
  JSON.stringify(
    {
      updatedDocument: draftAfter._id,
      inserted,
      publishedRevisionUnchanged: true,
    },
    null,
    2,
  ),
);
