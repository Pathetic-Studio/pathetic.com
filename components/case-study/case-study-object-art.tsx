import Image from "next/image";
import type { CaseStudy } from "@/lib/case-studies";
import styles from "./client-case-study.module.css";

/** The same artwork is used in the index, physics body and next-client panel. */
export default function CaseStudyObjectArt({
  object,
  priority = false,
}: {
  object: CaseStudy["object"];
  priority?: boolean;
}) {
  return (
    <span
      className={`${styles.objectArt} ${object.presentation === "photostrip" ? styles.photostrip : object.presentation === "ramp-card" ? styles.rampCard : ""}`}
    >
      <Image
        src={object.src}
        alt={object.alt}
        fill
        priority={priority}
        sizes={
          priority
            ? "(max-width: 760px) 160px, (min-width: 1458px) 350px, 24vw"
            : "(max-width: 760px) 180px, 340px"
        }
        draggable={false}
        style={{ objectFit: "contain" }}
      />
    </span>
  );
}
