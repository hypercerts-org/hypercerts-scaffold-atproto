import { LinkIcon } from "lucide-react";
import Link from "next/link";

export function URILink({ uri, label }: { uri?: string; label: string }) {
  if (!uri || typeof uri !== "string") return null;
  return (
    <Link
      target="_blank"
      rel="noreferrer noopener"
      className="flex gap-2 items-center hover:text-blue-400 hover:underline"
      href={uri}
    >
      {label || "—"}
      <LinkIcon size={18} />
    </Link>
  );
}
