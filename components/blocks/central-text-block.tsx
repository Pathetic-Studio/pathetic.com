import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERYResult } from "@/sanity.types";
import { TEXT_STYLES } from "@/components/ui/text-styles";

type CentralTextBlockProps = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
  { _type: "central-text-block" }
>;

export default function CentralTextBlock({ body }: CentralTextBlockProps) {
  return (
    <div className="container py-20 lg:py-32 max-w-3xl mx-auto">
      {body && (
        <div className={`prose animate-fade-up opacity-0 [animation-delay:100ms] dark:prose-invert ${TEXT_STYLES.bodyLarge}`}>
          <PortableTextRenderer value={body} />
        </div>
      )}
    </div>
  );
}
