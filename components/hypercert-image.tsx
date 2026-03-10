"use client";

import Image from "next/image";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface HypercertImageProps {
  /** Pre-resolved image URL string (resolved on the server via resolveHypercertImageUrl) */
  src?: string | null;
  /** Alt text for the image */
  alt?: string;
  /** Additional className for the Next.js Image element (e.g. hover effects) */
  className?: string;
  /** Whether to use priority loading (Next.js Image prop) */
  priority?: boolean;
  /** Responsive sizes hint for next/image when using `fill` */
  sizes?: string;
  /** Fallback content when no image is available. Defaults to an Award icon. Pass `null` to render nothing. */
  fallback?: React.ReactNode;
}

export default function HypercertImage(props: HypercertImageProps) {
  const { src, alt, className, priority, sizes, fallback } = props;

  if (src) {
    return (
      <Image
        fill
        src={src}
        alt={alt ?? "Hypercert image"}
        sizes={sizes}
        className={cn("object-cover", className)}
        priority={priority}
      />
    );
  }

  // No image URL
  if (fallback === null) {
    return null;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  // Default fallback
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <Award className="text-create-accent/30 size-16" />
    </div>
  );
}
