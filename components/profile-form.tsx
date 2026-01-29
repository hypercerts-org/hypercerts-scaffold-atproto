"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import ImageUploader from "@/components/image-uploader";
import { useUpdateProfileMutation } from "@/queries/profile";

export default function ProfileForm({
  initialProfile,
}: {
  initialProfile: {
    displayName: string;
    description: string;
    avatarUrl: string;
    bannerUrl: string;
  };
}) {
  const [displayName, setDisplayName] = useState(initialProfile.displayName);
  const [description, setDescription] = useState(initialProfile.description);

  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl);
  const [bannerUrl, setBannerUrl] = useState(initialProfile.bannerUrl);

  const [avatarImage, setAvatarImage] = useState<File>();
  const [bannerImage, setBannerImage] = useState<File>();

  const updateProfileMutation = useUpdateProfileMutation({
    onSuccess: (data) => {
      // update UI to reflect stored profile URLs
      setAvatarUrl(data.profile.avatar || "");
      setBannerUrl(data.profile.banner || "");
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    updateProfileMutation.mutate({
      displayName,
      description,
      avatar: avatarImage,
      banner: bannerImage,
    });
  };

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
              if (file.size > 1_000_000) {
                toast.error("Banner image must be less than 1MB");
                return;
              }
              setBannerUrl(URL.createObjectURL(file));
              setBannerImage(file);
            }}
          />
        </div>

        <div className="space-y-2">
          <ImageUploader
            label="Avatar"
            aspect="square"
            imageUrl={avatarUrl}
            onFileSelect={(file) => {
              if (file.size > 1_000_000) {
                toast.error("Avatar image must be less than 1MB");
                return;
              }
              setAvatarUrl(URL.createObjectURL(file));
              setAvatarImage(file);
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
            placeholder="Tell the world about yourself..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateProfileMutation.isPending}>
            {updateProfileMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
