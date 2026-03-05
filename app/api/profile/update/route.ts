import { NextResponse } from "next/server";
import { getAgent } from "@/lib/atproto-session";
import { revalidatePath } from "next/cache";
import { convertBlobUrlToCdn } from "@/lib/utils";
import { getSession } from "@/lib/atproto-session";
import { resolveSessionPds } from "@/lib/server-utils";
import { AppCertifiedActorProfile } from "@hypercerts-org/lexicon";
import { assertValidRecord } from "@/lib/record-validation";
import { getCertifiedProfileImageURL } from "@/lib/profile-utils";

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

    const avatarRaw = formData.get("avatar") as File | null;
    const bannerRaw = formData.get("banner") as File | null;
    // Treat empty/zero-size files as "no upload"
    const avatar = avatarRaw && avatarRaw.size > 0 ? avatarRaw : null;
    const banner = bannerRaw && bannerRaw.size > 0 ? bannerRaw : null;

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
      (existingResult?.data?.value as
        | AppCertifiedActorProfile.Record
        | undefined) ?? null;

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

      const record: AppCertifiedActorProfile.Record = {
        $type: "app.certified.actor.profile",
        createdAt: new Date().toISOString(),
      };
      if (displayName) record.displayName = displayName;
      if (description) record.description = description;
      if (pronouns) record.pronouns = pronouns;
      if (website) record.website = website;
      if (avatarBlob)
        record.avatar = {
          $type: "org.hypercerts.defs#smallImage" as const,
          image: avatarBlob,
        };
      if (bannerBlob)
        record.banner = {
          $type: "org.hypercerts.defs#largeImage" as const,
          image: bannerBlob,
        };

      try {
        assertValidRecord(
          "certifiedProfile",
          record,
          AppCertifiedActorProfile.validateRecord,
        );
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Validation failed" },
          { status: 400 },
        );
      }

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
      const updateRecord: AppCertifiedActorProfile.Record = {
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
      if (avatarBlob)
        updateRecord.avatar = {
          $type: "org.hypercerts.defs#smallImage" as const,
          image: avatarBlob,
        };
      if (bannerBlob)
        updateRecord.banner = {
          $type: "org.hypercerts.defs#largeImage" as const,
          image: bannerBlob,
        };

      try {
        assertValidRecord(
          "certifiedProfile",
          updateRecord,
          AppCertifiedActorProfile.validateRecord,
        );
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Validation failed" },
          { status: 400 },
        );
      }

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
    const updated = updatedResult?.data?.value as
      | AppCertifiedActorProfile.Record
      | undefined;

    // Convert BlobRef objects to URLs, then to CDN URLs
    const session = await getSession();
    const pdsUrl = session ? await resolveSessionPds(session) : undefined;
    const avatarUrl =
      convertBlobUrlToCdn(
        getCertifiedProfileImageURL(updated?.avatar, repo.assertDid, pdsUrl),
      ) || "";
    const bannerUrl =
      convertBlobUrlToCdn(
        getCertifiedProfileImageURL(updated?.banner, repo.assertDid, pdsUrl),
      ) || "";

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
