"use client";

import { useCallback, useState, type ReactNode } from "react";
import WorkContentViewer from "@/components/blocks/what-we-do/work-content-viewer";
import { getInstagramPost } from "@/lib/instagram-posts";

export default function InstagramPostLink({ href, children }: { href: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const post = getInstagramPost(href);
  return <>
    <a href={href} target="_blank" rel="noopener noreferrer"
      aria-haspopup={post ? "dialog" : undefined}
      onClick={(event) => {
        if (!post || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        setOpen(true);
      }}>{children}</a>
    <WorkContentViewer content={open && post ? post : null} onClose={close} />
  </>;
}
