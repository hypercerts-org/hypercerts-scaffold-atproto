import { LinkIcon } from "lucide-react";
import Link from "next/link";

export function URILink({ uri }: { uri: string }) {
  return (
    <Link
      target="_blank"
      rel="noreferrer nooopener"
      className="flex gap-2 items-center hover:text-blue-400 hover:underline"
      href={`https://pdsls.dev/${uri}`}
    >
      {uri || "—"}
      <LinkIcon size={18} />
    </Link>
  );
}
