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

    // Check if profile exists by fetching it first
    let existingProfile;
    try {
      existingProfile = await repo.profile.getCertifiedProfile();
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
        pronouns?: string;
        website?: string;
        avatar?: File;
        banner?: File;
      } = {};

      if (displayName) createParams.displayName = displayName;
      if (description) createParams.description = description;
      if (pronouns) createParams.pronouns = pronouns;
      if (website) createParams.website = website;
      if (avatar) createParams.avatar = avatar;
      if (banner) createParams.banner = banner;

      await repo.profile.createCertifiedProfile(createParams);
    } else {
      // For update: use null to remove fields, undefined to preserve
      const updateParams: {
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
        updateParams.avatar = avatar;
      }
      if (banner) {
        updateParams.banner = banner;
      }

      await repo.profile.updateCertifiedProfile(updateParams);
    }
    revalidatePath("/profile");

    const updated = await repo.profile.getCertifiedProfile();

    // Avatar and banner are already converted to blob URLs by getCertifiedProfile()
    const avatarUrl = updated?.avatar || "";
    const bannerUrl = updated?.banner || "";

    return NextResponse.json({
      ok: true,
      profile: {
        displayName: updated?.displayName || "",
        description: updated?.description || "",
        pronouns: updated?.pronouns || "",
        website: updated?.website || "",
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
