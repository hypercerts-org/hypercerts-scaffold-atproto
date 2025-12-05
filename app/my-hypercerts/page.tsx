"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Record as Hypercert } from "@/lexicons/types/org/hypercerts/claim/activity";
import { Collections } from "@/lib/types";
import { getBlobURL, parseAtUri } from "@/lib/utils";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function MyHypercertsPage() {
  const { atProtoAgent, session } = useOAuthContext();
  const [hypercerts, setMyHypercerts] = useState<
    (Hypercert & { uri: string })[]
  >([]);

  useEffect(() => {
    async function fetchMyHypercerts() {
      if (!atProtoAgent || !session) return;

      try {
        const response = await atProtoAgent.com.atproto.repo.listRecords({
          repo: atProtoAgent.assertDid,
          collection: Collections.claim,
          limit: 100,
        });

        const records = response.data.records.map((record) => {
          return { uri: record.uri, ...record.value } as Hypercert & {
            uri: string;
          };
        });
        setMyHypercerts(records);
      } catch (error) {
        console.error("Error fetching hypercerts:", error);
      }
    }

    fetchMyHypercerts();
  }, [atProtoAgent, session]);

  return (
    <main className="max-w-md mx-auto py-10 gap-4 flex flex-col">
      <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
        My Hypercerts
      </h1>
      <div>
        {hypercerts.length === 0 ? (
          <p>No hypercerts found.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {hypercerts.map((cert) => {
              return (
                <Link
                  key={cert.uri}
                  href={`/${parseAtUri(cert.uri)?.rkey || ""}`}
                >
                  <Card key={cert.uri}>
                    <CardHeader>
                      <CardTitle>{cert?.title}</CardTitle>
                      <CardDescription>
                        {cert?.shortDescription}
                      </CardDescription>
                      <CardAction>
                        <Button>view</Button>
                      </CardAction>
                    </CardHeader>
                    <CardContent>
                      {!!getBlobURL(cert?.image, session?.did) && (
                        <div className="relative aspect-square max-w-md">
                          <Image
                            fill
                            alt="cover image"
                            src={getBlobURL(cert?.image, session?.did)!}
                          />
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
    </main>
  );
}
