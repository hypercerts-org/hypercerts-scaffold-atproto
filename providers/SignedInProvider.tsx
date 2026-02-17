import LoginDialog from "@/components/login-dialog";
import Navbar from "@/components/navbar";
import { getSession, getAuthenticatedRepo } from "@/lib/atproto-session";
import { getBlobURL, convertBlobUrlToCdn } from "@/lib/utils";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { AuthErrorToast } from "./AuthErrorToast";

export async function SignedInProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([getSession(), cookies()]);
  const activeDid = cookieStore.get("active-did")?.value || session?.did;

  let avatarUrl: string | undefined = undefined;
  let handle: string | undefined = undefined;
  let activeProfileName: string | undefined = undefined;
  let activeProfileHandle: string | undefined = undefined;

  if (session) {
    const repo = await getAuthenticatedRepo();

    const profile = repo
      ? await repo.profile.getCertifiedProfile().catch(() => null)
      : null;

    avatarUrl = convertBlobUrlToCdn(profile?.avatar) || "";
    handle = profile?.handle || "";
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
        activeDid={activeDid}
        activeProfileName={activeProfileName}
        activeProfileHandle={activeProfileHandle}
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
