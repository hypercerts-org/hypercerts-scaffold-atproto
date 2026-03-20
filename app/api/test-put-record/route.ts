import { getRepoContext } from "@/lib/repo-context";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { collection, rkey, record } = body as {
      collection: string;
      rkey: string;
      record: Record<string, unknown>;
    };

    if (!collection || !rkey || !record) {
      return NextResponse.json(
        { error: "Missing required fields: collection, rkey, record" },
        { status: 400 },
      );
    }

    const ctx = await getRepoContext();
    if (!ctx) {
      return NextResponse.json(
        { error: "Could not authenticate repo" },
        { status: 401 },
      );
    }

    const result = await ctx.agent.com.atproto.repo.putRecord({
      repo: ctx.userDid,
      collection,
      rkey,
      record,
      validate: false,
    });

    return NextResponse.json({ uri: result.data.uri, cid: result.data.cid });
  } catch (e) {
    console.error("Error in test-put-record:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to put record" },
      { status: 500 },
    );
  }
}
