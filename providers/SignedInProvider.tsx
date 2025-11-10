"use client";
import { Spinner } from "@/components/ui/spinner";
import { useOAuthContext } from "./OAuthProviderSSR";
import LoginDialog from "@/components/login-dialog";
import Navbar from "@/components/navbar";

export function SignedInProvider({ children }: { children?: React.ReactNode }) {
  const { isSignedIn, isLoading } = useOAuthContext();

  return (
    <>
      <Navbar />
      {isSignedIn ? (
        <>{children}</>
      ) : (
        <div className="flex grow flex-col items-center justify-center">
          {!isLoading ? <LoginDialog /> : <Spinner />}
        </div>
      )}
    </>
  );
}
