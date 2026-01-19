// components/header/index.tsx
import MobileNav from "@/components/header/mobile-nav";
import DesktopNav from "@/components/header/desktop-nav";
import MobileHeaderSocialAnim from "@/components/header/mobile-header-social-anim";
import MobileHeaderLogo from "@/components/header/mobile-header-logo";
import { InstagramIcon } from "../ui/instagram-icon";
import { fetchSanitySettings, fetchSanityNavigation } from "@/sanity/lib/fetch";

export default async function Header() {
  const settings = await fetchSanitySettings();
  const navigation = await fetchSanityNavigation();

  const navDoc = navigation?.[0];
  const instagramUrl = navDoc?.instagram ?? null;

  return (
    <header id="site-header-root" className="fixed inset-x-0 top-0 z-[70]">
      <div className="w-full px-4 flex items-center justify-between py-4">
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
