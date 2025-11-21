"use client";
import Loader from "@/components/loader";
import LoginDialog from "@/components/login-dialog";
import Navbar from "@/components/navbar";
import { useOAuthContext } from "./OAuthProviderSSR";

export function SignedInProvider({ children }: { children?: React.ReactNode }) {
  const { isSignedIn, isLoading } = useOAuthContext();

  return (
    <>
      <Navbar />
      {isSignedIn ? (
        <>{children}</>
      ) : (
        <div className="flex grow flex-col items-center justify-center">
          {!isLoading ? <LoginDialog /> : <Loader />}
        </div>
      )}
    </>
  );
}
