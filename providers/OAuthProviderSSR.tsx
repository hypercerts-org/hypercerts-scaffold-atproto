"use client";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  BrowserOAuthClient,
  OAuthSession,
} from "@atproto/oauth-client-browser";
import { HANDLE_RESOLVER_URL, METADATA } from "@/utils/constants";
import { buildClientMetadata } from "@/utils/oauthClient";
import { Agent } from "@atproto/api";

// this implementation is mostly copied from the official oauth browser implementation from atproto: https://github.com/bluesky-social/atproto/blob/main/packages/oauth/oauth-client-browser-example/src/providers/OAuthProvider.tsx

type OAuthContext = {
  session: OAuthSession | null;
  atProtoAgent: Agent | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signIn: (input: string) => Promise<void>;
  signOut: () => Promise<void>;
};
const OAuthContext = createContext<OAuthContext | null>(null);

export function OAuthProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<OAuthSession | null>(null);
  const [atProtoAgent, setAtprotoAgent] = useState<Agent | null>(null);

  const clientRef = useRef<BrowserOAuthClient | null>(null);
  const initStartedRef = useRef(false);

  useEffect(() => {
    if (clientRef.current) return;
    clientRef.current = new BrowserOAuthClient({
      // keep as true for now
      allowHttp: true,
      handleResolver: HANDLE_RESOLVER_URL,
      clientMetadata:
        process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
          ? METADATA
          : buildClientMetadata(),
    });
  }, []);

  // initialize by restoring a previous session (once)
  useEffect(() => {
    const client = clientRef.current;
    if (!client || initStartedRef.current) return;
    initStartedRef.current = true;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const result = await client.init(false);
        if (cancelled || !result) return;

        const { session } = result;
        setSession(session);
        const agent = new Agent(session);
        setAtprotoAgent(agent);

        if (result.state === undefined) {
          void session.getTokenInfo(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // If the current session gets deleted (e.g. from another browser tab, or
  // because a refresh token was revoked), clear it
  useEffect(() => {
    const client = clientRef.current;
    if (!client || !session) return;

    const handleDelete = (event: CustomEvent<{ sub: string }>) => {
      if (event.detail.sub === session.did) setSession(null);
    };
    client.addEventListener("deleted", handleDelete);
    return () => client.removeEventListener("deleted", handleDelete);
  }, [session]);

  // When initializing the AuthProvider, we used "false" as restore's refresh
  // argument so that the app can work off-line. The following effect will
  // ensure that the session is pro actively refreshed whenever the app gets
  // back online.
  useEffect(() => {
    if (!session) return;
    const check = () => {
      void session.getTokenInfo(true).catch((err) => {
        console.warn("Failed to refresh OAuth session token info:", err);
      });
    };
    const interval = setInterval(check, 10 * 60e3);
    return () => clearInterval(interval);
  }, [session]);

  const signIn = useCallback(async (input: string) => {
    const client = clientRef.current;
    if (!client) return;
    setLoading(true);
    try {
      const session =
        (await client
          .restore(input, true)
          .catch(async () => client.signIn(input))) ?? null;
      setSession(session);
    } catch (error) {
      console.log("Sign-in error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      await session.signOut();
    } finally {
      setSession(null);
      setLoading(false);
    }
  }, [session]);

  return (
    <OAuthContext.Provider
      value={{
        session,
        atProtoAgent,
        isLoading: loading,
        isSignedIn: !!session,
        signIn,
        signOut,
      }}
    >
      {children}
    </OAuthContext.Provider>
  );
}

export function useOAuthContext() {
  const value = useContext(OAuthContext);
  if (!value) throw new Error("useOAuth must be used within an OAuthProvider");
  return value;
}

export function useOAuthSession(): OAuthSession {
  const { session } = useOAuthContext();
  if (!session) throw new Error("User is not logged in");
  return session;
}
