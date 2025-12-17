// components/footer.tsx
import { fetchSanitySettings, fetchSanityNavigation } from "@/sanity/lib/fetch";
import FooterClient from "./footer-client";

export default async function Footer() {
  const settings = await fetchSanitySettings();
  const navigation = await fetchSanityNavigation();

  const nav = navigation?.[0];
  const footerLeftLinks = nav?.footerLeftLinks || [];
  const footerRightLinks = nav?.footerRightLinks || [];

  return (
    <FooterClient
      settings={settings}
      footerLeftLinks={footerLeftLinks as any}
      footerRightLinks={footerRightLinks as any}
    />
  );
}
