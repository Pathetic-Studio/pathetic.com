import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERYResult } from "@/sanity.types";

type CentralTextBlockProps = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
  { _type: "central-text-block" }
>;

export default function CentralTextBlock({ body }: CentralTextBlockProps) {
  return (
    <div className="container py-20 lg:py-32 max-w-3xl mx-auto">
      {body && (
        <div className="prose dark:prose-invert text-lg animate-fade-up opacity-0 [animation-delay:100ms]">
          <PortableTextRenderer value={body} />
        </div>
      )}
    </div>
  );
}
