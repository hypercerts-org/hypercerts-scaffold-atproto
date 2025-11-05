import { useMemo } from "react";
import { Agent } from "@atproto/api";
import { useOAuthSession } from "../providers/OAuthProvider";

export function useAtprotoClient() {
  const session = useOAuthSession();
  return useMemo(() => new Agent(session), [session]);
}
