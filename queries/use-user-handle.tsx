import { useEffect, useState } from "react";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";

export function useUserHandle() {
  const { isSignedIn, atProtoAgent, session } = useOAuthContext();
  const [userHandle, setUserHandle] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserHandle() {
      if (!atProtoAgent || !isSignedIn) {
        setUserHandle(null);
        return;
      }

      try {
        // Fetch handle from API
        const { data } = await atProtoAgent.com.atproto.server.getSession();
        setUserHandle(data?.handle || null);
      } catch (error) {
        console.error("Error fetching user handle:", error);
        setUserHandle(null);
      }
    }

    fetchUserHandle();
  }, [atProtoAgent, isSignedIn, session]);

  return userHandle;
}

