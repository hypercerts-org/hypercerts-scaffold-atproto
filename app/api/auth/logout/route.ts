import { getSession } from "@/lib/atproto-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();
    const cookieStore = await cookies();
    if (session) {
      session.signOut();
      cookieStore.delete("user-did");
    }
    return NextResponse.json(
      { message: "Signed out successfully" },
      { status: 200 }
    );
  } catch (e) {
    console.error("Error logging out", e);
    return NextResponse.json({ error: "Signout failed" }, { status: 500 });
  }
}
