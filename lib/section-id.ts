// lib/section-id.ts
export function getSectionId(
  blockType: string,
  key: string | undefined,
  anchorId?: string | null
) {
  if (anchorId && anchorId.trim().length > 0) return anchorId.trim();
  if (!key) return blockType;
  return `${blockType}-${key}`;
}
