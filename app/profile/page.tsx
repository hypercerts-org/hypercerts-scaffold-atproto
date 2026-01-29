import { redirect } from "next/navigation";
import { getAuthenticatedRepo, getSession } from "@/lib/atproto-session";
import ProfileForm from "@/components/profile-form";
import { getBlobURL } from "@/lib/utils";

export default async function ProfilePage() {
  const repo = await getAuthenticatedRepo("pds");
  if (!repo) redirect("/");

  const session = await getSession();
  const profile = await repo.profile.get();

  // Get user DID and PDS URL for blob resolution
  const userDid = session?.did;
  const sessionIssuer = session?.serverMetadata.issuer;

  // Convert blob references to URLs, matching the pattern used in hypercerts page
  // Profile avatar/banner can be Uri objects or SmallImage/LargeImage objects
  // fix for now for interop demo - same pattern as hypercerts page
  const avatarUrl = profile.avatar
    ? getBlobURL((profile.avatar as any).image, userDid, sessionIssuer) || ""
    : "";
  const bannerUrl = profile.banner
    ? getBlobURL((profile.banner as any).image, userDid, sessionIssuer) || ""
    : "";

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
