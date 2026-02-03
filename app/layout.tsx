import { Toaster } from "@/components/ui/sonner";
import AllProviders from "@/providers/AllProviders";
import { SignedInProvider } from "@/providers/SignedInProvider";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Syne, Outfit } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hypercerts-scaffold.vercel.app"),
  title: {
    default: "Hypercerts Scaffold",
    template: "%s | Hypercerts Scaffold",
  },
  description:
    "A starter application for building on AT Protocol with Hypercerts. Create, manage, and view verifiable impact claims using decentralized identity.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hypercerts-scaffold.vercel.app",
    siteName: "Hypercerts Scaffold",
    title: "Hypercerts Scaffold",
    description:
      "Create, manage, and view verifiable impact claims on AT Protocol with Hypercerts.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hypercerts Scaffold",
    description:
      "Create, manage, and view verifiable impact claims on AT Protocol with Hypercerts.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} ${outfit.variable} antialiased`}
      >
        <AllProviders>
          <SignedInProvider>{children}</SignedInProvider>
          <Toaster />
        </AllProviders>
      </body>
    </html>
  );
}
