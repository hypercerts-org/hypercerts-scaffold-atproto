import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedRepo, getSession } from "@/lib/atproto-session";
import ProfileForm from "@/components/profile-form";
import { getBlobURL } from "@/lib/utils";
import { UserCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Profile",
  description:
    "View and edit your AT Protocol profile. Manage your display name, bio, avatar, and other profile settings.",
  openGraph: {
    title: "Profile",
    description: "View and edit your AT Protocol profile.",
  },
};

export default async function ProfilePage() {
  const repo = await getAuthenticatedRepo("pds");
  if (!repo) redirect("/");
  const profile = await repo.profile.getCertifiedProfile();

  const avatarUrl = profile?.avatar || "";
  const bannerUrl = profile?.banner || "";

  return (
    <div className="relative min-h-screen noise-bg">
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* Page header */}
        <div className="mb-8 lg:mb-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-full bg-create-accent/10 flex items-center justify-center">
              <UserCircle className="size-5 text-create-accent" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-[family-name:var(--font-syne)] font-bold tracking-tight text-foreground">
              Profile
            </h1>
          </div>
          <p className="mt-2 text-sm font-[family-name:var(--font-outfit)] text-muted-foreground max-w-xl pl-[52px]">
            Manage your display name, bio, avatar, and profile settings.
          </p>
        </div>

        {/* Main content */}
        <main className="max-w-2xl animate-fade-in-up">
          <ProfileForm
            initialProfile={{
              displayName: profile?.displayName || "",
              description: profile?.description || "",
              pronouns: profile?.pronouns || "",
              website: profile?.website || "",
              avatarUrl,
              bannerUrl,
            }}
          />
        </main>
      </div>
    </div>
  );
}
