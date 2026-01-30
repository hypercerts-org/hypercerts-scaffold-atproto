import { redirect } from "next/navigation";
import { getAuthenticatedRepo, getSession } from "@/lib/atproto-session";
import ProfileForm from "@/components/profile-form";
import { getBlobURL } from "@/lib/utils";

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
