import { redirect } from "next/navigation";
import { getAuthenticatedRepo } from "@/lib/atproto-session";
import ProfileForm from "@/components/profile-form";

export default async function ProfilePage() {
  const repo = await getAuthenticatedRepo("pds");
  if (!repo) redirect("/");

  const profile = await repo.profile.get();

  return (
    <ProfileForm
      initialProfile={{
        displayName: profile.displayName || "",
        description: profile.description || "",
        avatarUrl: profile.avatar || "",
        bannerUrl: profile.banner || "",
      }}
    />
  );
}
