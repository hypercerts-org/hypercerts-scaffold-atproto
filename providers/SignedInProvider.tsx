import LoginDialog from "@/components/login-dialog";
import Navbar from "@/components/navbar";
import { getSession, getAgent } from "@/lib/atproto-session";
import { getBlobURL, convertBlobUrlToCdn } from "@/lib/utils";
import { resolveSessionPds } from "@/lib/server-utils";
import { Suspense } from "react";
import { AuthErrorToast } from "./AuthErrorToast";
import type { CertifiedActorProfile } from "@/lib/types";

export async function SignedInProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [session] = await Promise.all([getSession()]);

  let avatarUrl: string | undefined = undefined;
  let handle: string | undefined = undefined;

  if (session) {
    const agent = await getAgent();
    if (agent) {
      const profileResult = await agent.com.atproto.repo
        .getRecord({
          repo: agent.assertDid,
          collection: "app.certified.actor.profile",
          rkey: "self",
        })
        .catch(() => null);
      const profile = profileResult?.data?.value as
        | CertifiedActorProfile
        | undefined;

      const pdsUrl = await resolveSessionPds(session);
      const rawAvatarUrl = getBlobURL(profile?.avatar, agent.assertDid, pdsUrl);
      avatarUrl = convertBlobUrlToCdn(rawAvatarUrl) || "";
      handle = profile?.handle || "";
    }
  }

  return (
    <>
      <Suspense fallback={null}>
        <AuthErrorToast />
      </Suspense>
      <Navbar
        isSignedIn={!!session}
        avatarUrl={avatarUrl}
        handle={handle}
        userDid={session?.did}
      />
      {session ? (
        <>{children}</>
      ) : (
        <div className="flex grow flex-col items-center justify-center">
          <LoginDialog />
        </div>
      )}
    </>
  );
}
