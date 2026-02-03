import { LinkIcon } from "lucide-react";
import Link from "next/link";

export function URILink({ uri, label }: { uri?: string; label: string }) {
  if (!uri || typeof uri !== "string") return null;
  return (
    <Link
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex gap-1.5 items-center hover:text-create-accent hover:underline transition-colors group"
      href={uri}
    >
      <span className="break-all">{label || "—"}</span>
      <LinkIcon className="size-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}
