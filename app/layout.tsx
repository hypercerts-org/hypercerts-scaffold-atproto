import { Toaster } from "@/components/ui/sonner";
import AllProviders from "@/providers/AllProviders";
import { SignedInProvider } from "@/providers/SignedInProvider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AllProviders>
          <SignedInProvider>{children}</SignedInProvider>
          <Toaster />
        </AllProviders>
      </body>
    </html>
  );
}
