// components/instagram-icon.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FaInstagram } from "react-icons/fa";

type InstagramIconProps = {
  instagramUrl?: string | null;
};

export function InstagramIcon({ instagramUrl }: InstagramIconProps) {
  if (!instagramUrl) return null;

  return (
    <Link href={instagramUrl} target="_blank" rel="noopener noreferrer" >
      <Button variant="icon" size="icon" aria-label="Instagram" className="relative cursor-pointer hover:scale-[1.1] duration-150 transition-all ease-in-out">
        <FaInstagram
          data-header-social-native
          className="h-[1.5rem] w-[1.5rem] scale-x-[0.6]"
        />
        <FaInstagram
          data-header-social-matrix
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[1.5rem] w-[1.5rem] -translate-x-1/2 -translate-y-1/2 scale-x-[0.6]"
        />
      </Button>
    </Link>
  );
}
