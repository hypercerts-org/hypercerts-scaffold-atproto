"use client";

import { useRef } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ImageUploader({
  label,
  imageUrl,
  onFileSelect,
  aspect = "square", // "square" | "banner"
  className,
}: {
  label?: string;
  imageUrl?: string | null;
  onFileSelect: (file: File) => void;
  aspect?: "square" | "banner";
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  const isBanner = aspect === "banner";

  const containerStyles = isBanner
    ? "w-full h-40 rounded-none"
    : "w-24 h-24 rounded-full";

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs font-medium tracking-wider uppercase">
          {label}
        </p>
      ) : null}

      <div className={cn(!isBanner && "relative inline-block")}>
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden",
            containerStyles,
            isBanner
              ? "from-create-accent/20 via-create-accent/10 to-muted bg-gradient-to-br"
              : "from-create-accent/15 to-muted rounded-full bg-gradient-to-br",
          )}
        >
          {/* Single hidden input — always rendered so inputRef is always valid */}
          <input
            ref={inputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* If image exists, show it */}
          {imageUrl ? (
            <>
              <Image
                src={imageUrl}
                alt="Uploaded image"
                fill
                unoptimized
                className={cn(
                  "object-cover",
                  isBanner ? "rounded-none" : "rounded-full",
                )}
              />

              {/* Camera icon overlay — banner only (avatar button is outside overflow-hidden) */}
              {isBanner ? (
                <button
                  type="button"
                  aria-label="Change image"
                  onClick={() => inputRef.current?.click()}
                  className="absolute right-2 bottom-2 z-10 rounded-full bg-black/40 p-2 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-black/60"
                >
                  <Camera className="h-4 w-4 text-white" />
                </button>
              ) : null}
            </>
          ) : (
            // If no image, show upload UI (label click triggers the shared input above)
            <button
              type="button"
              aria-label="Upload image"
              onClick={() => inputRef.current?.click()}
              className={cn(
                "border-create-accent/20 hover:border-create-accent/40 hover:bg-create-accent/5 flex h-full w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed transition-all duration-200",
                isBanner ? "rounded-none" : "rounded-full",
              )}
            >
              <Camera className="text-create-accent/50 mb-1 h-5 w-5" />
              <span className="text-muted-foreground font-[family-name:var(--font-outfit)] text-[10px] font-medium">
                Upload
              </span>
            </button>
          )}
        </div>

        {/* Avatar camera button — outside overflow-hidden so it is not clipped by the circle */}
        {!isBanner && imageUrl ? (
          <button
            type="button"
            aria-label="Change image"
            onClick={() => inputRef.current?.click()}
            className="absolute right-0 bottom-0 z-10 rounded-full bg-black/40 p-2 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-black/60"
          >
            <Camera className="h-4 w-4 text-white" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
