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
  const repo = await getAuthenticatedRepo();
  if (!repo) redirect("/");
  const profile = await repo.profile.getBskyProfile();

  const avatarUrl = profile.avatar || "";
  const bannerUrl = profile.banner || "";

  return (
    <div className="noise-bg relative min-h-screen">
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 lg:py-12">
        {/* Page header */}
        <div className="animate-fade-in mb-8 lg:mb-10">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/10">
              <UserCircle className="size-5 text-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-foreground font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight lg:text-4xl">
                Bsky Profile
              </h1>
              <span className="rounded-md border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                Bluesky
              </span>
            </div>
          </div>
          <p className="text-muted-foreground mt-2 max-w-xl pl-[52px] font-[family-name:var(--font-outfit)] text-sm">
            Manage your Bluesky display name, bio, avatar, and banner.
          </p>
        </div>

        {/* Main content */}
        <main className="animate-fade-in-up max-w-2xl">
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
