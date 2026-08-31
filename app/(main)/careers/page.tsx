import Link from "next/link";

export default function CareersPage() {
  return (
    <main className="min-h-svh bg-[#c0c0c0] px-4 py-24 text-black sm:px-8">
      <section className="mx-auto w-full max-w-3xl border-2 border-[#111] bg-[#c0c0c0] font-mono shadow-[12px_14px_0_rgba(0,0,0,.35)]">
        <header className="flex h-8 items-center justify-between bg-[#000080] px-2 text-sm font-bold text-white">
          <span>Pathetic Careers</span>
          <Link href="/" className="grid size-5 place-items-center border border-white bg-[#c0c0c0] leading-none text-black" aria-label="Return home">×</Link>
        </header>
        <div className="grid min-h-[28rem] place-items-center px-6 py-12 text-center">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/basket-links/computer.png" alt="Pathetic jobs computer" className="mx-auto h-48 w-48 object-contain" style={{ transform: "rotate(-22deg)" }} />
            <h1 className="mt-2 text-[clamp(2.5rem,9vw,6rem)] font-black uppercase leading-[.82] tracking-[-.07em]">Careers</h1>
            <p className="mx-auto mt-6 max-w-lg text-base leading-snug">
              New roles are loading. Check back soon or introduce yourself through the contact form.
            </p>
            <Link href="/#contact" className="mt-7 inline-block border-2 border-b-black border-l-white border-r-black border-t-white bg-[#c0c0c0] px-5 py-3 text-sm font-bold uppercase active:border-b-white active:border-l-black active:border-r-white active:border-t-black">
              Contact Pathetic
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
