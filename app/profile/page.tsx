import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedRepo, getSession } from "@/lib/atproto-session";
import ProfileForm from "@/components/profile-form";
import { getBlobURL } from "@/lib/utils";

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
  const profile = await repo.profile.get();

  const avatarUrl = profile.avatar || "";
  const bannerUrl = profile.banner || "";

  return (
    <ProfileForm
      initialProfile={{
        displayName: profile.displayName || "",
        description: profile.description || "",
        pronouns: profile.pronouns || "",
        website: profile.website || "",
        avatarUrl,
        bannerUrl,
      }}
    />
  );
}
