"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import ImageUploader from "@/components/image-uploader";
import { uploadFile } from "@/lib/queries";
import { ProfileViewDetailed } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { AppBskyActorProfile } from "@atproto/api";

export default function ProfilePage() {
  const { atProtoAgent, session } = useOAuthContext();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profileView, setProfileView] = useState<ProfileViewDetailed>();
  const [profileRecord, setProfileRecord] =
    useState<AppBskyActorProfile.Record>();
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [avatarImage, setAvatarImage] = useState<File>();
  const [bannerImage, setBannerImage] = useState<File>();
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  useEffect(() => {
    if (!atProtoAgent || !session) {
      router.push("/");
      return;
    }
    async function getProfile() {
      if (!atProtoAgent || !session) return;
      try {
        setLoading(true);

        const [userProfile, recordRes] = await Promise.all([
          atProtoAgent.app.bsky.actor.getProfile({
            actor: atProtoAgent.assertDid,
          }),
          atProtoAgent.com.atproto.repo.getRecord({
            repo: atProtoAgent.assertDid,
            collection: "app.bsky.actor.profile",
            rkey: "self",
          }),
        ]);

        setProfileView(userProfile.data);

        const record = recordRes.data.value;
        setProfileRecord(record as AppBskyActorProfile.Record);

        const value = userProfile.data;
        setDisplayName(value.displayName || "");
        setDescription(value.description || "");
        setWebsite(value.website || ""); // if you're using custom fields
        setPronouns(value.pronouns || "");
        setAvatarUrl(value.avatar || "");
        setBannerUrl(value.banner || "");
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    getProfile();
  }, [atProtoAgent, session, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!atProtoAgent || !profileRecord) return;

    try {
      setSaving(true);

      let uploadedBanner;
      let uploadedAvatar;

      if (bannerImage) {
        uploadedBanner = await uploadFile(atProtoAgent, bannerImage);
      }

      if (avatarImage) {
        uploadedAvatar = await uploadFile(atProtoAgent, avatarImage);
      }

      const record = {
        ...profileRecord,
        description,
        displayName,
        website,
        pronouns,
        banner: uploadedBanner
          ? { $type: "blob", ...uploadedBanner }
          : profileRecord.banner,
        avatar: uploadedAvatar
          ? { $type: "blob", ...uploadedAvatar }
          : profileRecord.avatar,
      };

      await atProtoAgent.com.atproto.repo.putRecord({
        repo: atProtoAgent.assertDid,
        collection: "app.bsky.actor.profile",
        rkey: "self",
        record,
      });

      toast.success("Profile successfully updated");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <ImageUploader
            label="Banner"
            aspect="banner"
            imageUrl={bannerUrl}
            onFileSelect={(file) => {
              const localUrl = URL.createObjectURL(file);
              if (file.size <= 1000000) {
                setBannerUrl(localUrl);
                setBannerImage(file);
              } else {
                toast.error("Banner image must be less than 1MB");
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <ImageUploader
            label="Avatar"
            aspect="square"
            imageUrl={avatarUrl}
            onFileSelect={(file) => {
              if (file.size <= 1000000) {
                const localUrl = URL.createObjectURL(file);
                setAvatarUrl(localUrl);
                setAvatarImage(file);
              } else {
                toast.error("Banner image must be less than 1MB");
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            placeholder="Your display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Bio</Label>
          <Textarea
            id="description"
            placeholder="Tell the world about yourself…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            placeholder="https://example.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pronouns">Pronouns</Label>
          <Input
            id="pronouns"
            placeholder="e.g., she/her, he/him, they/them"
            value={pronouns}
            onChange={(e) => setPronouns(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
