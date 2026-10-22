import Image from "next/image";
import type { WorkGalleryImage } from "@/lib/instagram-posts";

/** One non-destructive crop for thumbnails and the enlarged gallery window. */
export default function GalleryImage({
  image,
  className,
  sizes,
  loading,
  unoptimized,
}: {
  image: WorkGalleryImage;
  className?: string;
  sizes?: string;
  loading?: "eager" | "lazy";
  unoptimized?: boolean;
}) {
  const { crop } = image;
  if (crop) {
    return (
      <svg
        data-gallery-art
        data-gallery-crop
        width={crop.width}
        height={crop.height}
        viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`}
        overflow="hidden"
        role="img"
        aria-label={image.alt}
        className={className}
      >
        <image href={image.src} width={image.width} height={image.height} />
      </svg>
    );
  }
  return (
    <Image
      data-gallery-art
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      className={className}
      sizes={sizes}
      loading={loading}
      unoptimized={unoptimized}
      draggable={false}
    />
  );
}
