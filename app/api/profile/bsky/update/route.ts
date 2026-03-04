import { NextResponse } from "next/server";
import { getAgent } from "@/lib/atproto-session";
import { revalidatePath } from "next/cache";
import { getBlobURL, convertBlobUrlToCdn } from "@/lib/utils";
import { getSession } from "@/lib/atproto-session";
import { resolveSessionPds } from "@/lib/server-utils";

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
    const existingResult = await repo.com.atproto.repo
      .getRecord({
        repo: repo.assertDid,
        collection: "app.bsky.actor.profile",
        rkey: "self",
      })
      .catch(() => null);
    const existingProfile =
      (existingResult?.data?.value as Record<string, unknown> | null) ?? null;

    // If no displayName, assume no profile record exists yet
    if (!existingProfile?.displayName) {
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

      const record: Record<string, unknown> = {
        $type: "app.bsky.actor.profile",
      };
      if (displayName) record.displayName = displayName;
      if (description) record.description = description;
      if (avatarBlob) record.avatar = avatarBlob;
      if (bannerBlob) record.banner = bannerBlob;

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

      // Merge with existing record: null removes field, undefined preserves existing
      const record: Record<string, unknown> = {
        ...existingProfile,
        $type: "app.bsky.actor.profile",
        displayName: displayName || null,
        description: description || null,
      };

      // Only update avatar/banner if user uploaded new files
      if (avatarBlob) record.avatar = avatarBlob;
      if (bannerBlob) record.banner = bannerBlob;

      // Remove null fields (null means remove)
      if (record.displayName === null) delete record.displayName;
      if (record.description === null) delete record.description;

      await repo.com.atproto.repo.putRecord({
        repo: repo.assertDid,
        collection: "app.bsky.actor.profile",
        rkey: "self",
        record,
      });
    }
    revalidatePath("/bsky-profile");

    const updatedResult = await repo.com.atproto.repo
      .getRecord({
        repo: repo.assertDid,
        collection: "app.bsky.actor.profile",
        rkey: "self",
      })
      .catch(() => null);
    const updated =
      (updatedResult?.data?.value as Record<string, unknown> | null) ?? null;

    // Convert BlobRef objects to URLs, then to CDN URLs
    const session = await getSession();
    const pdsUrl = session ? await resolveSessionPds(session) : undefined;
    const avatarUrl =
      convertBlobUrlToCdn(
        getBlobURL(
          updated?.avatar as Parameters<typeof getBlobURL>[0],
          repo.assertDid,
          pdsUrl,
        ),
      ) || "";
    const bannerUrl =
      convertBlobUrlToCdn(
        getBlobURL(
          updated?.banner as Parameters<typeof getBlobURL>[0],
          repo.assertDid,
          pdsUrl,
        ),
      ) || "";

    return NextResponse.json({
      ok: true,
      profile: {
        displayName: (updated?.displayName as string | undefined) || "",
        description: (updated?.description as string | undefined) || "",
        avatar: avatarUrl,
        banner: bannerUrl,
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
