import { createClient } from "@sanity/client";

const draftId = "drafts.19106fca-b3c5-4297-8e44-c54a42a2b784";
const sourceKey = "eafb7f1980c3";
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

const source = await client.fetch(
  `*[_id == $draftId][0].blocks[_key == $sourceKey][0]`,
  { draftId, sourceKey },
);

if (!source) {
  throw new Error(`What We Believe block ${sourceKey} was not found.`);
}

if (source._type === "belief-section") {
  await client
    .patch(draftId)
    .set({
      [`blocks[_key=="${sourceKey}"].title`]: "WHAT WE BELIEVE",
      [`blocks[_key=="${sourceKey}"].cloudsEnabled`]: true,
      [`blocks[_key=="${sourceKey}"].cloudPartDuration`]: 1.6,
    })
    .commit();
  console.log("Updated the dedicated What We Believe draft title and cloud settings.");
  process.exit(0);
}

if (source._type !== "grid-row-animated") {
  throw new Error(`Expected grid-row-animated, found ${source._type}; no changes made.`);
}

await client
  .patch(draftId)
  .set({
    [`blocks[_key=="${sourceKey}"]`]: {
      ...source,
      _type: "belief-section",
      title: "WHAT WE BELIEVE",
      cloudsEnabled: true,
      cloudPartDuration: 1.6,
    },
  })
  .commit();

console.log("Converted What We Believe to its dedicated section in the homepage draft only.");
