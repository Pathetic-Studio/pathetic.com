import Footer from "@/components/footer";
import type { FooterLink } from "@/components/footer-client";

export type FooterBlock = {
  _type: "footer";
  _key: string;
  footerLeftLinks?: FooterLink[] | null;
  footerRightLinks?: FooterLink[] | null;
};

export default function FooterBlock({
  footerLeftLinks,
  footerRightLinks,
}: FooterBlock) {
  return (
    <Footer
      footerLeftLinks={footerLeftLinks}
      footerRightLinks={footerRightLinks}
    />
  );
}
