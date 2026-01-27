// lib/anon-generations.ts
// Client-side tracking for anonymous free meme generations.

const ANON_GENS_KEY = "pathetic_anon_gens";
export const MAX_FREE_GENS = 2;

export function getAnonGensUsed(): number {
  if (typeof window === "undefined") return 0;
  try {
    const val = localStorage.getItem(ANON_GENS_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export function incrementAnonGens(): void {
  try {
    const current = getAnonGensUsed();
    localStorage.setItem(ANON_GENS_KEY, String(current + 1));
    window.dispatchEvent(new Event("anon-gen-updated"));
  } catch {
    // localStorage unavailable (private browsing, etc.)
  }
}

export function hasAnonGensRemaining(): boolean {
  return getAnonGensUsed() < MAX_FREE_GENS;
}
