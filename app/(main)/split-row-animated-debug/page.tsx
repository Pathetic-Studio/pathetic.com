import { stegaClean } from "next-sanity";
import SplitRowAnimated from "@/components/blocks/split/split-row-animated";
import SplitImageAnimate from "@/components/blocks/split/split-image-animate";
import { fetchSanityPageBySlug } from "@/sanity/lib/fetch";
import type { PAGE_QUERYResult } from "@/sanity.types";

type PageBlock = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type SplitRowAnimatedBlock = Extract<PageBlock, { _type: "split-row-animated" }>;
type SplitColumnAnimated = NonNullable<
  NonNullable<SplitRowAnimatedBlock["splitColumns"]>[number]
>;
type SplitImageAnimateColumn = Extract<
  SplitColumnAnimated,
  { _type: "split-image-animate" }
>;
type SplitCardsListAnimatedColumn = Extract<
  SplitColumnAnimated,
  { _type: "split-cards-list-animated" }
>;

type ImageDebugState = {
  key: string;
  label: string;
  detail?: string | null;
  activeIndex?: number;
  imageStage: number;
  effectsEnabled: boolean;
};

function isSplitRowAnimatedBlock(
  block: PageBlock | null | undefined,
): block is SplitRowAnimatedBlock {
  return block?._type === "split-row-animated";
}

function getTargetSplitBlock(blocks: PageBlock[]): SplitRowAnimatedBlock | null {
  const candidates = blocks.filter(isSplitRowAnimatedBlock);
  if (!candidates.length) return null;

  return (
    candidates.find((block) => block.anchor?.anchorId === "who-we-are") ??
    candidates.find((block) =>
      block.splitColumns?.some((column) => column._type === "split-image-animate"),
    ) ??
    candidates[0]
  );
}

function getImageColumn(
  block: SplitRowAnimatedBlock,
): SplitImageAnimateColumn | null {
  const column = block.splitColumns?.find(
    (item) => item._type === "split-image-animate",
  );

  return (column as SplitImageAnimateColumn | undefined) ?? null;
}

function getCardsColumn(
  block: SplitRowAnimatedBlock,
): SplitCardsListAnimatedColumn | null {
  const column = block.splitColumns?.find(
    (item) => item._type === "split-cards-list-animated",
  );

  return (column as SplitCardsListAnimatedColumn | undefined) ?? null;
}

function getCardTitles(cardsColumn: SplitCardsListAnimatedColumn | null) {
  return (
    cardsColumn?.list?.map((item, index) => {
      const cleaned = stegaClean(item?.title);
      return cleaned || `Card ${index + 1}`;
    }) ?? []
  );
}

function buildImageDebugStates(
  imageColumn: SplitImageAnimateColumn,
  cardsColumn: SplitCardsListAnimatedColumn | null,
): ImageDebugState[] {
  const cardTitles = getCardTitles(cardsColumn);

  if (imageColumn.useCustomEffect) {
    return [
      {
        key: "state-1",
        label: "State 1",
        detail: cardTitles[0] ?? "Default / first card",
        imageStage: 0,
        effectsEnabled: true,
      },
      {
        key: "state-2",
        label: "State 2",
        detail: cardTitles[1] ?? null,
        imageStage: 1,
        effectsEnabled: true,
      },
      {
        key: "state-3",
        label: "State 3",
        detail: cardTitles[2] ?? null,
        imageStage: 2,
        effectsEnabled: true,
      },
    ];
  }

  return (imageColumn.images ?? []).map((image, index) => ({
    key: image?._key ?? image?.asset?._id ?? `image-${index}`,
    label: `Image ${index + 1}`,
    detail: cardTitles[index] ?? null,
    activeIndex: index,
    imageStage: 1,
    effectsEnabled: false,
  }));
}

export default async function SplitRowAnimatedDebugPage() {
  const page = await fetchSanityPageBySlug({ slug: "index" });
  const blocks = page?.blocks ?? [];
  const targetBlock = getTargetSplitBlock(blocks);

  if (!page || !targetBlock) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-24">
        <p className="text-xs uppercase tracking-[0.2em] opacity-50">
          Split Row Animated Debug
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          Could not find a homepage split-row-animated block.
        </h1>
        <p className="mt-4 text-base opacity-70">
          This route expects the homepage CMS data to contain a
          `split-row-animated` block, ideally the `who-we-are` section.
        </p>
      </main>
    );
  }

  const imageColumn = getImageColumn(targetBlock);
  const cardsColumn = getCardsColumn(targetBlock);
  const imageStates = imageColumn
    ? buildImageDebugStates(imageColumn, cardsColumn)
    : [];
  const anchorId = stegaClean(targetBlock.anchor?.anchorId) || null;
  const hasExtraCardsOnEffect3 =
    !!imageColumn?.useCustomEffect && (cardsColumn?.list?.length ?? 0) > 3;

  return (
    <main className="pb-24">
      <SplitRowAnimated {...targetBlock} />

      <section className="mx-auto mt-20 max-w-7xl px-4 lg:px-8">
        <div className="border-t border-border pt-10">
          <p className="text-xs uppercase tracking-[0.2em] opacity-50">
            Split Row Animated Debug
          </p>
          <h2 className="mt-3 text-3xl font-semibold">
            Image States
          </h2>
          <p className="mt-4 max-w-3xl text-sm opacity-70">
            This page renders the live homepage split section in isolation.
            {anchorId ? ` Source anchor: #${anchorId}.` : " Source: first matching animated split row."}
          </p>
        </div>

        {!imageColumn && (
          <p className="mt-8 text-sm opacity-70">
            This split block does not include a `split-image-animate` column, so
            there are no image effect states to inspect below.
          </p>
        )}

        {imageColumn && imageStates.length > 0 && (
          <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            {imageStates.map((state) => (
              <article
                key={state.key}
                className="rounded-[1.5rem] border border-border bg-background px-5 py-6"
              >
                <div className="mb-5 min-h-[3.5rem]">
                  <p className="text-xs uppercase tracking-[0.16em] opacity-50">
                    {state.label}
                  </p>
                  {state.detail && (
                    <p className="mt-2 text-sm opacity-70">{state.detail}</p>
                  )}
                </div>

                <SplitImageAnimate
                  {...(imageColumn as any)}
                  activeIndex={state.activeIndex ?? 0}
                  imageStage={state.imageStage}
                  effectsEnabled={state.effectsEnabled}
                />
              </article>
            ))}
          </div>
        )}

        {hasExtraCardsOnEffect3 && (
          <p className="mt-8 text-sm opacity-70">
            Cards after the third card reuse the third image state.
          </p>
        )}
      </section>
    </main>
  );
}
