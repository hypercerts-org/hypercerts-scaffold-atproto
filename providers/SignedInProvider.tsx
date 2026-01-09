import LoginDialog from "@/components/login-dialog";
import Navbar from "@/components/navbar";
import { getSession, getAuthenticatedRepo } from "@/lib/atproto-session";

export async function SignedInProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  const session = await getSession();

  let avatarUrl = "";
  let handle = "";

  if (session) {
    const repo = await getAuthenticatedRepo("pds");
    const profile = repo ? await repo.profile.get() : null;
    avatarUrl = profile?.avatar || "";
    handle = profile?.handle || "";
  }

  return (
    <>
      <Navbar isSignedIn={!!session} avatarUrl={avatarUrl} handle={handle} />
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
