import { getSession } from "@/lib/atproto-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [session, cookieStore] = await Promise.all([getSession(), cookies()]);
    if (session) {
      await session.signOut();
      cookieStore.delete("user-did");
    }
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
