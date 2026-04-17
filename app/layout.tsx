import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rendallpod.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Rendall — Create and Sell Custom Products",
    template: "%s · Rendall",
  },
  description: "The print-on-demand platform that matches everyone on quality — and aims to beat everyone on price.",
  applicationName: "Rendall",
  keywords: ["print on demand", "custom t-shirts", "POD", "clothing brand", "Rendall"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Rendall",
    title: "Rendall — Create and Sell Custom Products",
    description: "The print-on-demand platform that matches everyone on quality — and aims to beat everyone on price.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rendall — Create and Sell Custom Products",
    description: "The print-on-demand platform that matches everyone on quality — and aims to beat everyone on price.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
