// components/header/index.tsx
import MobileNav from "@/components/header/mobile-nav";
import DesktopNav from "@/components/header/desktop-nav";
import MobileHeaderSocialAnim from "@/components/header/mobile-header-social-anim";
import MobileHeaderLogo from "@/components/header/mobile-header-logo";
import { InstagramIcon } from "../ui/instagram-icon";
import { fetchSanitySettings, fetchSanityNavigation } from "@/sanity/lib/fetch";
import type { NAVIGATION_QUERYResult } from "@/sanity.types";

// Shared by desktop and mobile, without changing the published navigation document.
const PRIMARY_LINKS = [
  { _key: "services", _type: "link", title: "Our Services", linkType: "anchor-link", anchorId: "what-we-do-grid", href: "/#what-we-do-grid", buttonVariant: "menu" },
  { _key: "work", _type: "link", title: "Our Work", linkType: "internal", href: "/case-study", buttonVariant: "menu" },
  { _key: "jobs", _type: "link", title: "Jobs", linkType: "internal", href: "/jobs", buttonVariant: "menu" },
  { _key: "contact", _type: "link", title: "Contact Us", linkType: "contact", buttonVariant: "menu" },
] as NAVIGATION_QUERYResult[number]["rightLinks"];

export default async function Header() {
  const settings = await fetchSanitySettings();
  const navigation = (await fetchSanityNavigation()).map((document) => ({
    ...document,
    rightLinks: PRIMARY_LINKS,
  }));

  const navDoc = navigation?.[0];
  const instagramUrl = navDoc?.instagram ?? null;

  return (
    <header id="site-header-root" className="pointer-events-none fixed inset-x-0 top-0 z-[70]">
      <div
        className="w-full px-4 flex items-center justify-between py-4"
        data-deploy-marker="live-push-test-2026-04-18"
      >
        {/* Mobile layout */}
        <div className="flex flex-1 items-center xl:hidden">
          {instagramUrl && (
            <MobileHeaderSocialAnim>
              <InstagramIcon instagramUrl={instagramUrl} />
            </MobileHeaderSocialAnim>
          )}
        </div>

        <div className="flex justify-center xl:hidden">
          <MobileHeaderLogo />
        </div>

        <div className="flex flex-1 justify-end items-center gap-3 xl:hidden">
          <MobileNav navigation={navigation} settings={settings} />
        </div>

        {/* Desktop layout */}
        <DesktopNav navigation={navigation} settings={settings} />
      </div>
    </header>
  );
}
