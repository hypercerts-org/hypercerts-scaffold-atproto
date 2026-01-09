import Loader from "@/components/loader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAuthenticatedRepo, getSession } from "@/lib/atproto-session";
import { getBlobURL } from "@/lib/utils";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function MyHypercertsPage() {
  const repo = await getAuthenticatedRepo("pds");
  const session = await getSession();

  if (!repo || !session) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const did = cookieStore.get("user-did")?.value;
  const { records } = await repo.hypercerts.list({ limit: 100 });
  const sessionIssuer = session.serverMetadata.issuer;

  return (
    <main className="max-w-md mx-auto py-10 gap-4 flex flex-col">
      <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
        My Hypercerts
      </h1>

      {!records ? (
        <Loader />
      ) : (
        <div>
          {records.length === 0 ? (
            <p>No hypercerts found.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {records.map(({ record: cert, uri }) => {
                const imageUrl =
                  did && cert.image
                    ? getBlobURL(cert.image, did, sessionIssuer)
                    : null;
                return (
                  <Link key={uri} href={`/${encodeURIComponent(uri)}`}>
                    <Card>
                      <CardHeader>
                        <CardTitle>{cert.title}</CardTitle>
                        <CardDescription>
                          {cert?.shortDescription}
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        {!!imageUrl && (
                          <div className="relative aspect-square max-w-md">
                            <Image fill alt="cover image" src={imageUrl} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
