import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAgent, getSession } from "@/lib/atproto-session";
import ProfileForm from "@/components/profile-form";
import { convertBlobUrlToCdn } from "@/lib/utils";
import { resolveSessionPds } from "@/lib/server-utils";
import { KeyRound, UserCircle } from "lucide-react";
import { AppCertifiedActorProfile } from "@hypercerts-org/lexicon";
import { getCertifiedProfileImageURL } from "@/lib/profile-utils";
import { Button } from "@/components/ui/button";

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
  const repo = await getAgent();
  if (!repo) redirect("/");
  const profileResult = await repo.com.atproto.repo
    .getRecord({
      repo: repo.assertDid,
      collection: "app.certified.actor.profile",
      rkey: "self",
    })
    .catch(() => null);
  const profile = profileResult?.data?.value as
    | AppCertifiedActorProfile.Record
    | undefined;

  const session = await getSession();
  const pdsUrl = session ? await resolveSessionPds(session) : undefined;
  const avatarUrl =
    convertBlobUrlToCdn(
      getCertifiedProfileImageURL(profile?.avatar, repo.assertDid, pdsUrl),
    ) || "";
  const bannerUrl =
    convertBlobUrlToCdn(
      getCertifiedProfileImageURL(profile?.banner, repo.assertDid, pdsUrl),
    ) || "";

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

          <section className="mt-6">
            <div className="glass-panel overflow-hidden rounded-2xl">
              <div className="px-6 py-5">
                {/* Section heading */}
                <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs tracking-wider uppercase">
                  Account
                </p>

                {/* Change Password row */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-create-accent/10 flex size-8 items-center justify-center rounded-full">
                      <KeyRound className="text-create-accent size-4" />
                    </div>
                    <div>
                      <p className="font-[family-name:var(--font-outfit)] text-sm font-medium">
                        Change Password
                      </p>
                      <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs">
                        Update your account password
                      </p>
                    </div>
                  </div>
                  <Link href="/reset-password">
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-[family-name:var(--font-outfit)]"
                    >
                      Change password
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
