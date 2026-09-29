import Link from "next/link";
import { getCaseStudyTiles } from "@/lib/case-studies";
import CaseStudyJumble from "./case-study-jumble";
import styles from "./case-studies.module.css";

export default function CaseStudyIndex() {
  return (
    <div className={styles.page} data-case-study-index>
      <header className={styles.indexHero}>
        <Link className={styles.backLink} href="/#what-we-do">
          ← Work
        </Link>
        <h1 className={styles.client}>Case Studies</h1>
      </header>
      <CaseStudyJumble items={getCaseStudyTiles()} collection />
    </div>
  );
}
