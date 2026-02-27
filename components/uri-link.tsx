import { LinkIcon } from "lucide-react";
import Link from "next/link";

export function URILink({ uri, label }: { uri?: string; label: string }) {
  if (!uri || typeof uri !== "string") return null;
  return (
    <Link
      target="_blank"
      rel="noreferrer noopener"
      className="hover:text-create-accent group inline-flex items-center gap-1.5 transition-colors hover:underline"
      href={uri}
    >
      <span className="break-all">{label || "—"}</span>
      <LinkIcon className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
