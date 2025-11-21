"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getRecordWithURI } from "@/lib/queries";
import {
  Collections,
  type HypercertLocationData,
  type HypercertRecordData,
} from "@/lib/types";
import { getPDSlsURI } from "@/lib/utils";
import { BlobDisplay } from "./blob-display";
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

  const locationRecord = location.value;
  return (
    <div className="space-y-4">
      <Card className="border">
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Location Protocol Version"
              value={locationRecord.lpVersion || "—"}
            />
            <Field
              label="Spatial Reference System (SRS)"
              value={locationRecord.srs || "—"}
            />

            <Field label="Location Type" value={locationRecord.locationType || "—"} />
            <Field
              label="Created At"
              value={
                locationRecord.createdAt
                  ? new Date(locationRecord.createdAt).toLocaleString()
                  : "—"
              }
            />

            <Field label="Location Name" value={locationRecord.name || "—"} />

            <div className="md:col-span-2">
              <LabelSmall>Location Description</LabelSmall>
              <p className="text-sm whitespace-pre-wrap">
                {locationRecord.description || "—"}
              </p>
            </div>

            <div className="md:col-span-2">
              <LabelSmall>Location Data</LabelSmall>
              <BlobDisplay
                content={locationRecord.location}
                did={atProtoAgent?.assertDid}
              />
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
