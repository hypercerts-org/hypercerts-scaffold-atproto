"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

import { SmallBlob, Uri } from "@/lexicons/types/app/certified/defs";
import { getRecordWithURI } from "@/lib/queries";
import {
  Collections,
  type HypercertLocationData,
  type HypercertRecordData,
} from "@/lib/types";
import { getBlobURL, getPDSlsURI } from "@/lib/utils";
import { $Typed } from "@atproto/api";
import { Field, LabelSmall } from "./hypercert-field";
import Loader from "./loader";
import { URILink } from "./uri-link";

export default function LocationView({
  hypercertData,
}: {
  hypercertData?: HypercertRecordData;
}) {
  const { atProtoAgent } = useOAuthContext();
  const hypercertRecord = hypercertData?.value;

  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<HypercertLocationData | null>(null);

  useEffect(() => {
    async function fetchLocation() {
      if (!atProtoAgent) return;
      const locationRef = hypercertRecord?.location;
      if (!locationRef?.uri) return;

      setLoading(true);
      try {
        const data = await getRecordWithURI<HypercertLocationData>(
          locationRef.uri,
          atProtoAgent,
          Collections.location
        );
        setLocation(data);
      } catch (e) {
        console.error("Error loading location", e);
        toast.error("Failed to load location");
      } finally {
        setLoading(false);
      }
    }

    fetchLocation();
  }, [atProtoAgent, hypercertRecord?.location]);

  if (!hypercertRecord?.location) {
    return <p className="text-sm text-muted-foreground">No location linked.</p>;
  }

  if (loading) {
    return <Loader />;
  }

  if (!location) {
    return (
      <p className="text-sm text-muted-foreground">
        Location reference present, but details could not be loaded.
      </p>
    );
  }

  const record = location.value;

  const loc = record.location;
  const locType = loc?.$type as string | undefined;

  let locationContentDisplay: ReactNode = "—";

  if (locType === "app.certified.defs#uri") {
    const uri = (loc as $Typed<Uri>).value;
    locationContentDisplay = <URILink uri={getPDSlsURI(uri)} label={uri} />;
  } else if (
    locType === "app.certified.defs#smallBlob" ||
    locType === "smallBlob"
  ) {
    const blobRef = (loc as $Typed<SmallBlob>).ref;
    locationContentDisplay = (
      <p className="text-sm">
        Blob-based location data
        {blobRef && (
          <>
            {" · "}
            <URILink
              uri={getBlobURL(loc, atProtoAgent?.assertDid)}
              label={blobRef.toString()}
            />
          </>
        )}
      </p>
    );
  } else if (locType) {
    locationContentDisplay = (
      <span className="text-xs font-mono break-all">{locType}</span>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border">
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Location Protocol Version"
              value={record.lpVersion || "—"}
            />
            <Field
              label="Spatial Reference System (SRS)"
              value={record.srs || "—"}
            />

            <Field label="Location Type" value={record.locationType || "—"} />
            <Field
              label="Created At"
              value={
                record.createdAt
                  ? new Date(record.createdAt).toLocaleString()
                  : "—"
              }
            />

            <Field label="Location Name" value={record.name || "—"} />

            <div className="md:col-span-2">
              <LabelSmall>Location Description</LabelSmall>
              <p className="text-sm whitespace-pre-wrap">
                {record.description || "—"}
              </p>
            </div>

            <div className="md:col-span-2">
              <LabelSmall>Location Data</LabelSmall>
              <div className="text-sm">{locationContentDisplay}</div>
            </div>

            <Separator className="md:col-span-2" />

            <Field
              label="URI"
              value={
                <URILink
                  uri={getPDSlsURI(location.uri) || "—"}
                  label={location.uri}
                />
              }
              mono
            />
            <Field label="CID" value={location.cid || "—"} mono />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
