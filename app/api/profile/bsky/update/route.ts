import { NextResponse } from "next/server";
import { getAuthenticatedRepo } from "@/lib/atproto-session";
import { revalidatePath } from "next/cache";
import { convertBlobUrlToCdn } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const repo = await getAuthenticatedRepo();
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
        { status: 400 },
      );
    }
    if (banner && banner.size > 1_000_000) {
      return NextResponse.json(
        { error: "Banner must be less than 1MB" },
        { status: 400 },
      );
    }

    // Check if profile exists by fetching it first
    let existingProfile;
    try {
      existingProfile = await repo.profile.getBskyProfile();
    } catch (error) {
      // Profile doesn't exist yet
      existingProfile = null;
    }

    // If no displayName, assume no profile record exists yet
    if (!existingProfile?.displayName) {
      // For create: use undefined for empty fields (no null)
      const createParams: {
        displayName?: string;
        description?: string;
        avatar?: File;
        banner?: File;
      } = {};

      if (displayName) createParams.displayName = displayName;
      if (description) createParams.description = description;
      if (avatar) createParams.avatar = avatar;
      if (banner) createParams.banner = banner;

      await repo.profile.createBskyProfile(createParams);
    } else {
      // For update: use null to remove fields, undefined to preserve
      const updateParams: {
        displayName?: string | null;
        description?: string | null;
        avatar?: File | null;
        banner?: File | null;
      } = {
        displayName: displayName || null,
        description: description || null,
      };

      // Only include avatar/banner if user uploaded new files
      // Omitting them (undefined) tells SDK to preserve existing values
      if (avatar) {
        updateParams.avatar = avatar;
      }
      if (banner) {
        updateParams.banner = banner;
      }

      await repo.profile.updateBskyProfile(updateParams);
    }
    revalidatePath("/bsky-profile");

    const updated = await repo.profile.getBskyProfile();

    // Convert blob URLs to CDN URLs so Next.js remotePatterns allow them
    const avatarUrl = convertBlobUrlToCdn(updated.avatar) || "";
    const bannerUrl = convertBlobUrlToCdn(updated.banner) || "";

    return NextResponse.json({
      ok: true,
      profile: {
        displayName: updated.displayName || "",
        description: updated.description || "",
        avatar: avatarUrl,
        banner: bannerUrl,
      },
    });
  } catch (error) {
    console.error("Bsky profile update error:", error);
    return NextResponse.json(
      { error: `Profile update failed: ${(error as Error).message}` },
      { status: 500 },
    );
  }
}
