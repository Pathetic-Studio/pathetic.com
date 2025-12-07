// app/_not-found/page.tsx (or wherever this file actually lives)
import Header from "@/components/header";
import Footer from "@/components/footer";
import Custom404 from "@/components/404";

import { ContactModalProvider } from "@/components/contact/contact-modal-context";
import ContactModal from "@/components/contact/contact-modal";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFoundPage() {
  return (
    <ContactModalProvider>
      <Header />
      <Custom404 />
      <Footer />
      <ContactModal />
    </ContactModalProvider>
  );
}
