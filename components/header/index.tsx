//components/header/index.tsx
import Link from "next/link";
import Logo from "@/components/logo";
import MobileNav from "@/components/header/mobile-nav";
import DesktopNav from "@/components/header/desktop-nav";
import { ModeToggle } from "@/components/menu-toggle";
import LogoAnimated from "@/components/logo-animated";
import { fetchSanitySettings, fetchSanityNavigation } from "@/sanity/lib/fetch";

export default async function Header() {
  const settings = await fetchSanitySettings();
  const navigation = await fetchSanityNavigation();

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="w-full px-4 flex items-center justify-between py-4">
        {/* Mobile layout */}
        <div className="flex flex-1 items-center xl:hidden">
          <MobileNav navigation={navigation} settings={settings} />
        </div>


        <div className="flex justify-center xl:hidden">
          <Link
            href="/"
            aria-label="Home page"
            id="header-logo-main"
            className="flex items-center justify-center"
          >
            <LogoAnimated className="h-8 w-auto" />
          </Link>
        </div>



        <div className="flex flex-1 justify-end items-center gap-3 xl:hidden">
          <ModeToggle />
        </div>

        {/* Desktop layout: logo centered by DesktopNav, 
            toggle included inside right box in DesktopNav */}
        <DesktopNav navigation={navigation} settings={settings} />
      </div>
    </header>
  );
}
