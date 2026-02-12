import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedRepo } from "@/lib/atproto-session";
import BskyProfileForm from "@/components/bsky-profile-form";
import { UserCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Bsky Profile",
  description:
    "View and edit your Bluesky profile. Manage your display name, bio, avatar, and banner.",
  openGraph: {
    title: "Bsky Profile",
    description: "View and edit your Bluesky profile.",
  },
};

export default async function BskyProfilePage() {
  const repo = await getAuthenticatedRepo("pds");
  if (!repo) redirect("/");
  const profile = await repo.profile.getBskyProfile();

  const avatarUrl = profile.avatar || "";
  const bannerUrl = profile.banner || "";

  return (
    <div className="relative min-h-screen noise-bg">
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* Page header */}
        <div className="mb-8 lg:mb-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <UserCircle className="size-5 text-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl lg:text-4xl font-[family-name:var(--font-syne)] font-bold tracking-tight text-foreground">
                Bsky Profile
              </h1>
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-md border border-blue-500/30">
                Bluesky
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm font-[family-name:var(--font-outfit)] text-muted-foreground max-w-xl pl-[52px]">
            Manage your Bluesky display name, bio, avatar, and banner.
          </p>
        </div>

        {/* Main content */}
        <main className="max-w-2xl animate-fade-in-up">
          <BskyProfileForm
            initialProfile={{
              displayName: profile.displayName || "",
              description: profile.description || "",
              avatarUrl,
              bannerUrl,
            }}
          />
        </main>
      </div>
    </div>
  );
}
