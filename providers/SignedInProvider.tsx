import LoginDialog from "@/components/login-dialog";
import Navbar from "@/components/navbar";
import { getSession, getAuthenticatedRepo } from "@/lib/atproto-session";
import { convertBlobUrlToCdn } from "@/lib/utils";
import { Suspense } from "react";
import { AuthErrorToast } from "./AuthErrorToast";

export async function SignedInProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [session] = await Promise.all([getSession()]);

  let avatarUrl: string | undefined = undefined;
  let handle: string | undefined = undefined;

  if (session) {
    const repo = await getAuthenticatedRepo();
    if (repo) {
      const profile = await repo.profile
        .getCertifiedProfile()
        .catch(() => null);

      avatarUrl = convertBlobUrlToCdn(profile?.avatar) || "";
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
