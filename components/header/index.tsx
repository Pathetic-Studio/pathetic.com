// components/header/index.tsx
import Link from "next/link";
import MobileNav from "@/components/header/mobile-nav";
import DesktopNav from "@/components/header/desktop-nav";
import LogoAnimated from "@/components/logo-animated";
import { InstagramIcon } from "../ui/instagram-icon";
import {
  fetchSanitySettings,
  fetchSanityNavigation,
} from "@/sanity/lib/fetch";

export default async function Header() {
  const settings = await fetchSanitySettings();
  const navigation = await fetchSanityNavigation();

  const navDoc = navigation?.[0];
  const instagramUrl = navDoc?.instagram ?? null;

  return (
    <header
      id="site-header-root"
      className="fixed inset-x-0 top-0 z-[70]"
    >
      <div className="w-full px-4 flex items-center justify-between py-4">
        {/* Mobile layout */}
        <div className="flex flex-1 items-center xl:hidden">
          {instagramUrl && (
            <InstagramIcon instagramUrl={instagramUrl} />
          )}
        </div>

        <div className="flex justify-center xl:hidden">
          <Link
            href="/"
            aria-label="Home page"
            id="header-logo-main-mobile"
            data-header-logo-main="true"
            className="flex items-center justify-center"
          >
            <LogoAnimated className="h-8 w-auto" />
          </Link>
        </div>

        <div className="flex flex-1 justify-end items-center gap-3 xl:hidden">
          <MobileNav navigation={navigation} settings={settings} />
        </div>

        {/* Desktop layout: logo centered by DesktopNav */}
        <DesktopNav navigation={navigation} settings={settings} />
      </div>
    </header>
  );
}
