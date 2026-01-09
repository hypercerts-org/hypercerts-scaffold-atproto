import { NextResponse } from "next/server";
import { getAuthenticatedRepo } from "@/lib/atproto-session";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const repo = await getAuthenticatedRepo("pds");
    if (!repo) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();

    const displayName = formData.get("displayName")?.toString() || "";
    const description = formData.get("description")?.toString() || "";

    const avatar = formData.get("avatar") as File | null;
    const banner = formData.get("banner") as File | null;

    if (avatar && avatar.size > 1_000_000) {
      return NextResponse.json(
        { error: "Avatar must be less than 1MB" },
        { status: 400 }
      );
    }
    if (banner && banner.size > 1_000_000) {
      return NextResponse.json(
        { error: "Banner must be less than 1MB" },
        { status: 400 }
      );
    }

    await repo.profile.update({
      displayName,
      description,
      ...(avatar ? { avatar: avatar } : {}),
      ...(banner ? { banner: banner } : {}),
    });
    revalidatePath("/profile");

    const updated = await repo.profile.get();
    return NextResponse.json({
      ok: true,
      profile: {
        displayName: updated.displayName || "",
        description: updated.description || "",
        avatar: updated.avatar || "",
        banner: updated.banner || "",
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
