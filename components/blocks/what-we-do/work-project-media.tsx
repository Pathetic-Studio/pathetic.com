"use client";

import Image from "next/image";
import {
  WORK_MEDIA_FRAMES,
  type ResolvedFloatingProject,
} from "@/lib/work-projects";
import WorkPreview from "./work-preview";

export default function ProjectMedia({
  item,
  suspended,
}: {
  item: ResolvedFloatingProject;
  suspended: boolean;
}) {
  const isCover = item.mediaFit === "cover";
  if (item.mediaType === "video" && item.videoUrl) {
    return (
      <WorkPreview
        src={item.videoUrl}
        poster={item.videoPosterUrl}
        titleCard={item.titleCardUrl}
        videoScale={item.previewScale}
        title={item.title}
        suspended={suspended}
        cover={isCover}
      />
    );
  }

  if (item.imageUrl) {
    const trimmed = WORK_MEDIA_FRAMES[item._key]?.src;
    return (
      <Image
        src={
          trimmed ? `/images/what-we-do/trimmed/${trimmed}.webp` : item.imageUrl
        }
        alt={item.imageAlt || ""}
        fill
        style={
          item._key === "whatWeDoRamp"
            ? { transform: "rotate(-38deg) scale(.64)" }
            : undefined
        }
        loading="eager"
        sizes="(min-width: 1024px) 20vw, 40vw"
        className={isCover ? "object-cover" : "object-contain"}
      />
    );
  }

  return <div className="h-full w-full border border-current/20" />;
}
