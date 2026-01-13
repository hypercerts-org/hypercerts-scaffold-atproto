import Loader from "@/components/loader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRepoContext } from "@/lib/repo-context";
import { getSession } from "@/lib/atproto-session";
import { getBlobURL } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listOrgs } from "@/lib/create-actions";

const shortDid = (did: string) =>
  did.length > 28 ? `${did.slice(0, 18)}…${did.slice(-6)}` : did;

export default async function MyHypercertsPage({
  searchParams,
}: {
  searchParams?: Promise<{ profileDid: string }>;
}) {
  const ctx = await getRepoContext();
  const session = await getSession();
  const params = await searchParams;

  if (!ctx || !session) redirect("/");

  const { organizations } = await listOrgs();

  const profileDidParam = params?.profileDid;
  const selectedDid =
    typeof profileDidParam === "string" && profileDidParam.length > 0
      ? profileDidParam
      : ctx.activeDid;

  const viewCtx = await getRepoContext({ targetDid: selectedDid });
  if (!viewCtx) redirect("/");

  const chipHref = (did: string) => `?profileDid=${encodeURIComponent(did)}`;

  const { records } = await viewCtx.scopedRepo.hypercerts.list({ limit: 100 });
  const sessionIssuer = session.serverMetadata.issuer;

  const selectedLabel =
    selectedDid === ctx.userDid
      ? "Personal"
      : organizations.find((org) => org.did === selectedDid)?.name ??
        shortDid(selectedDid);

  return (
    <main className="max-w-4xl mx-auto py-10 gap-4 flex flex-col">
      <div className="text-center space-y-2">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
          Hypercerts
        </h1>
        <p className="text-sm text-muted-foreground">
          Viewing hypercerts for{" "}
          <span className="font-medium text-foreground">{selectedLabel}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          asChild
          size="sm"
          variant={selectedDid === ctx.userDid ? "default" : "outline"}
          className="rounded-full"
        >
          <Link href={chipHref(ctx.userDid)}>Personal</Link>
        </Button>

        {organizations.map((org) => (
          <Button
            key={org.did}
            asChild
            size="sm"
            variant={selectedDid === org.did ? "default" : "outline"}
            className="rounded-full"
          >
            <Link href={chipHref(org.did)}>{org.name}</Link>
          </Button>
        ))}
      </div>

      {!records ? (
        <Loader />
      ) : (
        <div className="max-w-md m-auto w-full">
          {records.length === 0 ? (
            <p>No hypercerts found.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {records.map(({ record: cert, uri }) => {
                const imageUrl =
                  viewCtx.targetDid && cert.image
                    ? getBlobURL(cert.image, viewCtx.targetDid, sessionIssuer)
                    : null;

                return (
                  <Link
                    key={uri}
                    href={`/hypercerts/${encodeURIComponent(uri)}`}
                  >
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
