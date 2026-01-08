import LoginDialog from "@/components/login-dialog";
import Navbar from "@/components/navbar";
import { getSession } from "@/lib/atproto-session";

export async function SignedInProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <>
      <Navbar isSignedIn={!!session} />
      {!session ? (
        <>{children}</>
      ) : (
        <div className="flex grow flex-col items-center justify-center">
          <LoginDialog />
          {/* {!isLoading ? <LoginDialog /> : <Loader />} */}
        </div>
      )}
    </>
  );
}
