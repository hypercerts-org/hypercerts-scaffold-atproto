"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Save } from "lucide-react";

import ImageUploader from "@/components/image-uploader";
import { useUpdateProfileMutation } from "@/queries/profile";

export default function ProfileForm({
  initialProfile,
}: {
  initialProfile: {
    displayName: string;
    description: string;
    pronouns: string;
    website: string;
    avatarUrl: string;
    bannerUrl: string;
  };
}) {
  const [displayName, setDisplayName] = useState(initialProfile.displayName);
  const [description, setDescription] = useState(initialProfile.description);
  const [pronouns, setPronouns] = useState(initialProfile.pronouns);
  const [website, setWebsite] = useState(initialProfile.website);

  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl);
  const [bannerUrl, setBannerUrl] = useState(initialProfile.bannerUrl);

  const [avatarImage, setAvatarImage] = useState<File>();
  const [bannerImage, setBannerImage] = useState<File>();

  const updateProfileMutation = useUpdateProfileMutation({
    onSuccess: (data) => {
      setAvatarUrl(data.profile.avatar || "");
      setBannerUrl(data.profile.banner || "");
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    updateProfileMutation.mutate({
      displayName,
      description,
      pronouns,
      website,
      avatar: avatarImage,
      banner: bannerImage,
    });
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      {/* Visual header: Banner + Avatar overlap */}
      <div className="relative">
        {/* Banner */}
        <div className="relative">
          <ImageUploader
            label=""
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

        {/* Avatar — overlapping the banner bottom edge */}
        <div className="absolute -bottom-10 left-6 z-10">
          <div className="rounded-full ring-4 ring-background shadow-lg">
            <ImageUploader
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
        </div>
      </div>

      {/* Form content — extra top padding to clear the overlapping avatar */}
      <form onSubmit={handleSubmit} className="px-6 pt-14 pb-6">
        <div className="space-y-6 stagger-children">
          {/* Display Name + Pronouns row */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="displayName"
                className="text-xs uppercase tracking-wider font-[family-name:var(--font-outfit)] text-muted-foreground"
              >
                Display Name
              </Label>
              <Input
                id="displayName"
                placeholder="Your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="font-[family-name:var(--font-outfit)]"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="pronouns"
                className="text-xs uppercase tracking-wider font-[family-name:var(--font-outfit)] text-muted-foreground"
              >
                Pronouns
              </Label>
              <Input
                id="pronouns"
                placeholder="e.g., they/them"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                maxLength={20}
                className="font-[family-name:var(--font-outfit)]"
              />
              <p className="text-[10px] font-[family-name:var(--font-outfit)] text-muted-foreground">
                Max 20 characters
              </p>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-xs uppercase tracking-wider font-[family-name:var(--font-outfit)] text-muted-foreground"
            >
              Bio
            </Label>
            <Textarea
              id="description"
              placeholder="Tell the world about yourself..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="font-[family-name:var(--font-outfit)] resize-none"
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label
              htmlFor="website"
              className="text-xs uppercase tracking-wider font-[family-name:var(--font-outfit)] text-muted-foreground"
            >
              Website
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="https://example.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="font-[family-name:var(--font-outfit)]"
            />
          </div>

          <Separator className="opacity-50" />

          {/* Save */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground font-[family-name:var(--font-outfit)] font-medium gap-2"
            >
              <Save className="size-4" />
              {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
