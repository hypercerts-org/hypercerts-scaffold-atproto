import { NextResponse } from "next/server";
import { getAgent } from "@/lib/atproto-session";
import { revalidatePath } from "next/cache";
import { AppBskyActorProfile } from "@atproto/api";
import { assertValidRecord } from "@/lib/record-validation";

export async function POST(req: Request) {
  try {
    const repoPromise = getAgent();
    const formData = await req.formData();
    const repo = await repoPromise;
    if (!repo) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const displayName = formData.get("displayName")?.toString() || "";
    const description = formData.get("description")?.toString() || "";

    const avatarRaw = formData.get("avatar");
    const bannerRaw = formData.get("banner");
    // Treat empty/zero-size files as "no upload"
    const avatar =
      avatarRaw instanceof File && avatarRaw.size > 0 ? avatarRaw : null;
    const banner =
      bannerRaw instanceof File && bannerRaw.size > 0 ? bannerRaw : null;

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
    const existingResult = await repo.com.atproto.repo
      .getRecord({
        repo: repo.assertDid,
        collection: "app.bsky.actor.profile",
        rkey: "self",
      })
      .catch(() => null);
    const existingProfile =
      (existingResult?.data?.value as AppBskyActorProfile.Record | undefined) ??
      null;

    // If no profile record exists yet, create it; otherwise update
    if (existingProfile === null) {
      // Upload blobs if provided
      let avatarBlob, bannerBlob;
      if (avatar) {
        const avatarData = new Blob([avatar], { type: avatar.type });
        const uploadResult = await repo.com.atproto.repo.uploadBlob(avatarData);
        avatarBlob = uploadResult.data.blob;
      }
      if (banner) {
        const bannerData = new Blob([banner], { type: banner.type });
        const uploadResult = await repo.com.atproto.repo.uploadBlob(bannerData);
        bannerBlob = uploadResult.data.blob;
      }

      const record: AppBskyActorProfile.Record = {
        $type: "app.bsky.actor.profile",
      };
      if (displayName) record.displayName = displayName;
      if (description) record.description = description;
      if (avatarBlob) record.avatar = avatarBlob;
      if (bannerBlob) record.banner = bannerBlob;

      try {
        assertValidRecord(
          "bskyProfile",
          record,
          AppBskyActorProfile.validateRecord,
        );
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Validation failed" },
          { status: 400 },
        );
      }

      await repo.com.atproto.repo.createRecord({
        repo: repo.assertDid,
        collection: "app.bsky.actor.profile",
        rkey: "self",
        record,
      });
    } else {
      // Upload blobs if provided
      let avatarBlob, bannerBlob;
      if (avatar) {
        const avatarData = new Blob([avatar], { type: avatar.type });
        const uploadResult = await repo.com.atproto.repo.uploadBlob(avatarData);
        avatarBlob = uploadResult.data.blob;
      }
      if (banner) {
        const bannerData = new Blob([banner], { type: banner.type });
        const uploadResult = await repo.com.atproto.repo.uploadBlob(bannerData);
        bannerBlob = uploadResult.data.blob;
      }

      // Merge with existing record: empty string removes field, non-empty sets it
      const record: AppBskyActorProfile.Record = {
        ...existingProfile,
        $type: "app.bsky.actor.profile" as const,
      };
      if (displayName) {
        record.displayName = displayName;
      } else {
        delete record.displayName;
      }
      if (description) {
        record.description = description;
      } else {
        delete record.description;
      }

      // Only update avatar/banner if user uploaded new files
      if (avatarBlob) record.avatar = avatarBlob;
      if (bannerBlob) record.banner = bannerBlob;

      try {
        assertValidRecord(
          "bskyProfile",
          record,
          AppBskyActorProfile.validateRecord,
        );
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Validation failed" },
          { status: 400 },
        );
      }

      await repo.com.atproto.repo.putRecord({
        repo: repo.assertDid,
        collection: "app.bsky.actor.profile",
        rkey: "self",
        record,
      });
    }
    revalidatePath("/bsky-profile");

    const updatedResult = await repo
      .getProfile({ actor: repo.assertDid })
      .catch(() => null);
    const updated = updatedResult?.data;

    return NextResponse.json({
      ok: true,
      profile: {
        displayName: updated?.displayName || "",
        description: updated?.description || "",
        avatar: updated?.avatar || "",
        banner: updated?.banner || "",
      },
    });
  } catch (error) {
    console.error("Bsky profile update error:", error);
    return NextResponse.json(
      {
        error: `Profile update failed: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    );
  }
}
