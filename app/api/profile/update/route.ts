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
    const pronouns = formData.get("pronouns")?.toString() || "";
    const website = formData.get("website")?.toString() || "";

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
    if (pronouns && pronouns.length > 20) {
      return NextResponse.json(
        { error: "Pronouns must be 20 characters or less" },
        { status: 400 },
      );
    }

    // Check if profile exists by fetching it first
    const existingResult = await repo.com.atproto.repo
      .getRecord({
        repo: repo.assertDid,
        collection: "app.certified.actor.profile",
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
        $type: "app.certified.actor.profile",
      };
      if (displayName) record.displayName = displayName;
      if (description) record.description = description;
      if (pronouns) record.pronouns = pronouns;
      if (website) record.website = website;
      if (avatarBlob) record.avatar = avatarBlob;
      if (bannerBlob) record.banner = bannerBlob;

      await repo.com.atproto.repo.createRecord({
        repo: repo.assertDid,
        collection: "app.certified.actor.profile",
        rkey: "self",
        record,
      });
    } else {
      // Upload new blobs if provided
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

      // Merge: null = remove, undefined = preserve existing, value = set
      const updateRecord: Record<string, unknown> = {
        ...existingProfile,
        $type: "app.certified.actor.profile",
      };

      // Handle string fields: null removes, truthy sets, falsy (empty string) removes
      if (displayName !== undefined) {
        if (displayName) updateRecord.displayName = displayName;
        else delete updateRecord.displayName;
      }
      if (description !== undefined) {
        if (description) updateRecord.description = description;
        else delete updateRecord.description;
      }
      if (pronouns !== undefined) {
        if (pronouns) updateRecord.pronouns = pronouns;
        else delete updateRecord.pronouns;
      }
      if (website !== undefined) {
        if (website) updateRecord.website = website;
        else delete updateRecord.website;
      }

      // Handle blobs: new File = upload and set
      if (avatarBlob) updateRecord.avatar = avatarBlob;
      if (bannerBlob) updateRecord.banner = bannerBlob;

      await repo.com.atproto.repo.putRecord({
        repo: repo.assertDid,
        collection: "app.certified.actor.profile",
        rkey: "self",
        record: updateRecord,
      });
    }
    revalidatePath("/profile");

    const updatedResult = await repo.com.atproto.repo
      .getRecord({
        repo: repo.assertDid,
        collection: "app.certified.actor.profile",
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
        pronouns: (updated?.pronouns as string | undefined) || "",
        website: (updated?.website as string | undefined) || "",
        avatar: avatarUrl,
        banner: bannerUrl,
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("Profile update error:", detail);
    return NextResponse.json(
      {
        error: `Failed to update profile: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    );
  }
}
