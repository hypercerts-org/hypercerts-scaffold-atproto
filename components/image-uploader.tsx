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
      {label && (
        <p className="text-xs uppercase tracking-wider font-[family-name:var(--font-outfit)] font-medium text-muted-foreground">
          {label}
        </p>
      )}

      <div className={cn(!isBanner && "relative inline-block")}>
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden",
            containerStyles,
            isBanner
              ? "bg-gradient-to-br from-create-accent/20 via-create-accent/10 to-muted"
              : "bg-gradient-to-br from-create-accent/15 to-muted rounded-full"
          )}
        >
          {/* If image exists, show it */}
          {imageUrl ? (
            <>
              <Image
                src={imageUrl}
                alt="Uploaded image"
                fill
                className={cn(
                  "object-cover",
                  isBanner ? "rounded-none" : "rounded-full"
                )}
              />

              {/* Camera icon overlay — banner only (avatar button is outside overflow-hidden) */}
              {isBanner && (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="absolute z-10 bg-black/40 backdrop-blur-sm p-2 rounded-full hover:bg-black/60 transition-all duration-200 hover:scale-110 bottom-2 right-2"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
              )}
            </>
          ) : (
            // If no image, show upload UI
            <label
              className={cn(
                "flex flex-col items-center justify-center w-full h-full cursor-pointer border-2 border-dashed border-create-accent/20 hover:border-create-accent/40 hover:bg-create-accent/5 transition-all duration-200",
                isBanner ? "rounded-none" : "rounded-full"
              )}
            >
              <Camera className="w-5 h-5 text-create-accent/50 mb-1" />
              <span className="text-[10px] font-[family-name:var(--font-outfit)] font-medium text-muted-foreground">
                Upload
              </span>

              <input
                ref={inputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          )}

          {/* Hidden input for replacing image */}
          <input
            ref={inputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Avatar camera button — outside overflow-hidden so it is not clipped by the circle */}
        {!isBanner && imageUrl && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute z-10 bg-black/40 backdrop-blur-sm p-2 rounded-full hover:bg-black/60 transition-all duration-200 hover:scale-110 bottom-0 right-0"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
