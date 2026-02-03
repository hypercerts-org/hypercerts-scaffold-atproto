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
  const [session, cookieStore] = await Promise.all([
    getSession(),
    cookies(),
  ]);
  const activeDid = cookieStore.get("active-did")?.value || session?.did;

  let avatarUrl: string | undefined = undefined;
  let handle: string | undefined = undefined;
  let activeProfileName: string | undefined = undefined;
  let activeProfileHandle: string | undefined = undefined;

  if (session) {
    const [repo, orgRepo] = await Promise.all([
      getAuthenticatedRepo("pds"),
      activeDid && activeDid !== session.did
        ? getAuthenticatedRepo("sds")
        : Promise.resolve(null),
    ]);

    const [profile, org] = await Promise.all([
      repo ? repo.profile.get() : Promise.resolve(null),
      orgRepo && activeDid && activeDid !== session.did
        ? orgRepo.organizations.get(activeDid)
        : Promise.resolve(null),
    ]);

    avatarUrl = profile?.avatar;
    handle = profile?.handle || "";

    if (org) {
      activeProfileName = org.name;
      activeProfileHandle = org.handle;
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
