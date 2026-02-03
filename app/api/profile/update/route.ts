import { NextResponse } from "next/server";
import { getAuthenticatedRepo, getSession } from "@/lib/atproto-session";
import { revalidatePath } from "next/cache";
import { getBlobURL } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const repo = await getAuthenticatedRepo("pds");
    if (!repo) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();

    const displayName = formData.get("displayName")?.toString() || "";
    const description = formData.get("description")?.toString() || "";
    const pronouns = formData.get("pronouns")?.toString() || "";
    const website = formData.get("website")?.toString() || "";

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
    if (pronouns && pronouns.length > 20) {
      return NextResponse.json(
        { error: "Pronouns must be 20 characters or less" },
        { status: 400 }
      );
    }

    // Build profile params - only include avatar/banner if user uploaded new files
    const profileParams: {
      displayName?: string | null;
      description?: string | null;
      pronouns?: string | null;
      website?: string | null;
      avatar?: File | null;
      banner?: File | null;
    } = {
      displayName: displayName || null,
      description: description || null,
      pronouns: pronouns || null,
      website: website || null,
    };

    // Only include avatar/banner if user uploaded new files
    // Omitting them (undefined) tells SDK to preserve existing values
    if (avatar) {
      profileParams.avatar = avatar;
    }
    if (banner) {
      profileParams.banner = banner;
    }

    // Check if profile exists by fetching it first
    const existingProfile = await repo.profile.get();

    // If no displayName, assume no profile record exists yet
    if (!existingProfile.displayName) {
      await repo.profile.create(profileParams);
    } else {
      await repo.profile.update(profileParams);
    }
    revalidatePath("/profile");

    const [updated, session] = await Promise.all([
      repo.profile.get(),
      getSession(),
    ]);
    const userDid = session?.did;
    const sessionIssuer = session?.serverMetadata.issuer;

    // Convert blob references to URLs, matching pattern from profile page
    // fix for now for interop demo - same pattern as hypercerts page
    const avatarUrl = updated.avatar
      ? getBlobURL((updated.avatar as any).image, userDid, sessionIssuer) || ""
      : "";
    const bannerUrl = updated.banner
      ? getBlobURL((updated.banner as any).image, userDid, sessionIssuer) || ""
      : "";

    return NextResponse.json({
      ok: true,
      profile: {
        displayName: updated.displayName || "",
        description: updated.description || "",
        pronouns: updated.pronouns || "",
        website: updated.website || "",
        avatar: avatarUrl,
        banner: bannerUrl,
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
