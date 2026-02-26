import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedRepo } from "@/lib/atproto-session";
import ProfileForm from "@/components/profile-form";
import { convertBlobUrlToCdn } from "@/lib/utils";
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
  const repo = await getAuthenticatedRepo();
  if (!repo) redirect("/");
  const profile = await repo.profile.getCertifiedProfile();

  const avatarUrl = convertBlobUrlToCdn(profile?.avatar);
  const bannerUrl = convertBlobUrlToCdn(profile?.banner);

  return (
    <div className="noise-bg relative min-h-screen">
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 lg:py-12">
        {/* Page header */}
        <div className="animate-fade-in mb-8 lg:mb-10">
          <div className="mb-2 flex items-center gap-3">
            <div className="bg-create-accent/10 flex size-10 items-center justify-center rounded-full">
              <UserCircle className="text-create-accent size-5" />
            </div>
            <h1 className="text-foreground font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight lg:text-4xl">
              Profile
            </h1>
          </div>
          <p className="text-muted-foreground mt-2 max-w-xl pl-[52px] font-[family-name:var(--font-outfit)] text-sm">
            Manage your display name, bio, avatar, and profile settings.
          </p>
        </div>

        {/* Main content */}
        <main className="animate-fade-in-up max-w-2xl">
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
