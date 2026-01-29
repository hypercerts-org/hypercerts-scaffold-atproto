import LoginDialog from "@/components/login-dialog";
import Navbar from "@/components/navbar";
import { getSession, getAuthenticatedRepo } from "@/lib/atproto-session";
import { getBlobURL } from "@/lib/utils";
import { cookies } from "next/headers";

export async function SignedInProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  const session = await getSession();
  const cookieStore = await cookies();
  const activeDid = cookieStore.get("active-did")?.value || session?.did;

  let avatarUrl: string | undefined = undefined;
  let handle: string | undefined = undefined;
  let activeProfileName: string | undefined = undefined;
  let activeProfileHandle: string | undefined = undefined;

  if (session) {
    const repo = await getAuthenticatedRepo("pds");
    const profile = repo ? await repo.profile.get() : null;
    avatarUrl = profile?.avatar ? getBlobURL(profile.avatar, session.did, session.serverMetadata.issuer) : "";
    handle = profile?.handle || "";

    if (activeDid && activeDid !== session.did) {
      const orgRepo = await getAuthenticatedRepo("sds");
      const org = orgRepo ? await orgRepo.organizations.get(activeDid) : null;
      if (org) {
        activeProfileName = org.name;
        activeProfileHandle = org.handle;
      }
    }
  }

  return (
    <>
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
