import { cn } from "@/lib/utils";
import type { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import Image from "next/image";

export default function UserAvatar({
  user,
  className,
}: {
  user: ProfileView;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      {!!user.avatar && (
        <Image
          src={user.avatar}
          width={32}
          height={32}
          alt="avatar"
          unoptimized
          className="h-8 w-8 rounded-full"
        />
      )}
      {!user.avatar && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-500 text-white">
          {user.displayName?.[0]?.toUpperCase() ??
            user.handle?.[0]?.toUpperCase() ??
            "?"}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <span className="text-sm">{user.displayName}</span>
        <span className="text-xs">{user.handle}</span>
      </div>
    </div>
  );
}
