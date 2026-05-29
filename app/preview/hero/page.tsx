import Image from "next/image";

export const metadata = { robots: { index: false, follow: false } };

export default function HeroPreviewPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <Image
        src="/preview-hero-mockup.png"
        alt="Hero mockup preview"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
    </main>
  );
}
