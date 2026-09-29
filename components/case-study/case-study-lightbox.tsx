"use client";

import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { useRef } from "react";
import type { CaseStudyImage } from "@/lib/case-studies";
import styles from "./case-study-galleries.module.css";

export default function CaseStudyLightbox({
  image,
  onClose,
}: {
  image: CaseStudyImage | null;
  onClose: () => void;
}) {
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root
      open={Boolean(image)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={styles.lightboxOverlay} />
        <Dialog.Content
          className={styles.lightbox}
          aria-describedby={undefined}
          onOpenAutoFocus={() => {
            opener.current = document.activeElement as HTMLElement;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus({ preventScroll: true });
          }}
        >
          <Dialog.Title className="sr-only">
            {image?.alt || "Project image"}
          </Dialog.Title>
          <Dialog.Close className={styles.close}>Close ×</Dialog.Close>
          {image && (
            <div className={styles.lightboxImage}>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="92vw"
                className={styles.contain}
              />
            </div>
          )}
          <p>{image?.alt}</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
