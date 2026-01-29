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

  // Style presets
  const containerStyles =
    aspect === "banner" ? "w-full h-40" : "w-24 h-24 rounded-full";

  return (
    <div className={cn("space-y-2", className)}>
      {label && <p className="text-sm font-medium">{label}</p>}

      <div
        className={cn(
          "relative bg-muted flex items-center justify-center rounded-md",
          containerStyles,
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
                "object-cover rounded-md",
                aspect !== "banner" && "rounded-full",
              )}
            />

            {/* Camera icon overlay */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute bottom-1 right-1 z-10 bg-black/50 backdrop-blur-sm p-2 rounded-full hover:bg-black/60 transition"
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
          </>
        ) : (
          // If no image, show upload UI
          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer border border-dashed border-muted-foreground/30 rounded-md hover:bg-muted/50 transition">
            <Camera className="w-6 h-6 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">Upload</span>

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
    </div>
  );
}
