// components/footer.tsx
import { fetchSanitySettings } from "@/sanity/lib/fetch";
import FooterClient, { type FooterLink } from "./footer-client";

type FooterProps = {
  footerLeftLinks?: FooterLink[] | null;
  footerRightLinks?: FooterLink[] | null;
};

export default async function Footer({
  footerLeftLinks,
  footerRightLinks,
}: FooterProps) {
  const settings = await fetchSanitySettings();

  return (
    <FooterClient
      settings={settings}
      footerLeftLinks={footerLeftLinks ?? []}
      footerRightLinks={footerRightLinks ?? []}
    />
  );
}
