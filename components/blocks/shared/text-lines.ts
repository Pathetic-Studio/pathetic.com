export function splitTextAtWordRatio(
  value: string,
  ratio = 0.6,
): [string, string] | [string] {
  const text = value.trim().replace(/\s+/g, " ");
  if (!text) return [""];

  const spaces = Array.from(text.matchAll(/ /g), (match) => match.index);
  if (!spaces.length) return [text];

  const target = text.length * Math.max(0.35, Math.min(0.7, ratio));
  const splitIndex = spaces.reduce((closest, index) =>
    Math.abs(index - target) < Math.abs(closest - target) ? index : closest,
  );

  return [text.slice(0, splitIndex), text.slice(splitIndex + 1)];
}
