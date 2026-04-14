import { getSession } from "@/lib/atproto-session";
import { sessionIdStore } from "@/lib/hypercerts-sdk";
import {
  LEGACY_ACTIVE_DID_COOKIE_NAME,
  LEGACY_USER_DID_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/lib/session-cookie";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const [session, cookieStore] = await Promise.all([getSession(), cookies()]);
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (session) {
      await session.signOut();
    }

    if (sessionId) {
      await sessionIdStore.del(sessionId);
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
    cookieStore.delete(LEGACY_USER_DID_COOKIE_NAME);
    cookieStore.delete(LEGACY_ACTIVE_DID_COOKIE_NAME);

    return NextResponse.json(
      { message: "Signed out successfully" },
      { status: 200 },
    );
  } catch (e) {
    console.error("Error logging out", e);
    return NextResponse.json(
      { error: `Logout failed: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 },
    );
  }
}
