"use client";

import Image from "next/image";
import EyeFollow from "@/components/effects/eye-follow";
import styles from "./client-case-study.module.css";

const metricEye = [{ _key: "views", x: 50, y: 50, size: 76, sizeMobile: 54 }];

/** Keep published results intact, with an eye for views and a star for actions. */
export default function CaseStudyResults({
  result,
  id,
}: {
  result: string;
  id: string;
}) {
  const metrics = result.split(/,\s*/);
  return (
    <ul className={styles.results} aria-label="Project results" data-count={metrics.length}>
      {metrics.map((metric, i) => {
        const views = /\bviews?\b/i.test(metric);
        const eyeId = `${id}-result-${i}`;
        return (
          <li key={metric} className={styles.result}>
            <div id={eyeId} className={styles.resultIcon} aria-hidden="true">
              {views ? (
                <EyeFollow
                  containerId={eyeId}
                  trackingContainerId={id}
                  eyes={metricEye}
                  enableClickToAdd={false}
                  rollOnExistingClick={false}
                  edgePadding={0}
                  mobileShadow="soft"
                />
              ) : (
                <Image
                  data-case-result-star
                  src="/images/case-studies/figma/imgStar3.svg"
                  alt=""
                  width={220.184}
                  height={115.827}
                />
              )}
            </div>
            <span>{metric}</span>
          </li>
        );
      })}
    </ul>
  );
}
