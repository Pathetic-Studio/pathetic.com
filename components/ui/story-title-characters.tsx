export function StoryTitleCharacters({ text, linkInstagram = false, scene = "lifecycle" }: { text: string; linkInstagram?: boolean; scene?: "lifecycle" | "space" }) {
  return (
    <>
      <span aria-hidden={linkInstagram ? undefined : true}>
        {text.split(/(\s+)/).map((token, tokenIndex) => {
          if (/^\s+$/.test(token)) return token;

          const characters = Array.from(token).map((character, characterIndex) => (
            <span
              key={`${character}-${characterIndex}`}
              data-lifecycle-title-char={scene === "lifecycle" ? "" : undefined}
              data-space-title-char={scene === "space" ? "" : undefined}
              className={scene === "lifecycle" ? "inline-block lg:opacity-0" : "inline-block"}
            >
              {character}
            </span>
          ));
          return linkInstagram && /^@?pathetic[.,]?$/i.test(token) ? (
            <a
              key={`${token}-${tokenIndex}`}
              href="https://www.instagram.com/pathetic/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="PATHETIC on Instagram"
              className="pointer-events-auto inline-block no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {token.startsWith("@") && characters[0]}
              {/* Compensate for line-box leading so the underline follows the
                  letters when the shared heading's line height changes. */}
              <span className="relative inline-block after:absolute after:inset-x-0 after:bottom-[calc(0.5lh_-_0.48em)] after:h-[.045em] after:bg-current">
                {characters.slice(token.startsWith("@") ? 1 : 0)}
              </span>
            </a>
          ) : (
            <span key={`${token}-${tokenIndex}`} className="inline-block">
              {characters}
            </span>
          );
        })}
      </span>
      {!linkInstagram && <span className="sr-only">{text}</span>}
    </>
  );
}


/** The same staggered rise for both chapters of the homepage story. */
export function storyTitleReveal(compact: boolean) {
  return { autoAlpha: 1, yPercent: 0, duration: 0.09, stagger: { amount: compact ? 0.22 : 0.3 }, ease: "power2.out" };
}
