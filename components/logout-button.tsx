"use client";

import { Button } from "@/components/ui/button";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";

export default function LogoutButton() {
  const { signOut, isLoading } = useOAuthContext();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      variant="outline"
    >
      Logout
    </Button>
  );
}

