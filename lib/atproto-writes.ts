import "server-only";

import { Agent } from "@atproto/api";
import { parseAtUri } from "./utils";

export interface StrongRef {
  uri: string;
  cid: string;
}

export interface LocationCreateParams {
  lpVersion: string;
  srs: string;
  locationType: string;
  location: string | File; // string URL or File (GeoJSON blob)
  name?: string;
  description?: string;
}

export async function resolveStrongRef(
  agent: Agent,
  uri: string,
  fallbackCollection?: string,
): Promise<StrongRef> {
  const parsed = parseAtUri(uri);
  if (!parsed) throw new Error(`Invalid AT-URI: ${uri}`);

  const result = await agent.com.atproto.repo.getRecord({
    repo: parsed.did,
    collection: parsed.collection || fallbackCollection || "",
    rkey: parsed.rkey,
  });

  if (!result.data.cid) throw new Error(`Record has no CID: ${uri}`);
  return { uri: result.data.uri, cid: result.data.cid };
}

export async function createLocationRecord(
  agent: Agent,
  did: string,
  params: LocationCreateParams,
): Promise<StrongRef> {
  // Resolve location content
  let locationContent: Record<string, unknown>;
  if (typeof params.location === "string") {
    // URL string
    locationContent = {
      $type: "org.hypercerts.defs#uri",
      uri: params.location,
    };
  } else {
    // File — upload as blob
    const blob = new Blob([params.location], { type: params.location.type });
    const uploadResult = await agent.com.atproto.repo.uploadBlob(blob);
    locationContent = {
      $type: "org.hypercerts.defs#smallBlob",
      blob: uploadResult.data.blob,
    };
  }

  const record: Record<string, unknown> = {
    $type: "app.certified.location",
    lpVersion: params.lpVersion,
    srs: params.srs,
    locationType: params.locationType,
    location: locationContent,
    createdAt: new Date().toISOString(),
  };
  if (params.name) record.name = params.name;
  if (params.description) record.description = params.description;

  const result = await agent.com.atproto.repo.createRecord({
    repo: did,
    collection: "app.certified.location",
    record,
  });

  return { uri: result.data.uri, cid: result.data.cid };
}

export async function processLocations(
  agent: Agent,
  did: string,
  locations: (string | LocationCreateParams)[],
): Promise<StrongRef[]> {
  return Promise.all(
    locations.map(async (loc) => {
      if (typeof loc === "string") {
        // Existing location AT-URI — resolve to StrongRef
        return resolveStrongRef(agent, loc, "app.certified.location");
      }
      // New location — create record
      return createLocationRecord(agent, did, loc);
    }),
  );
}

export async function uploadContentBlob(
  agent: Agent,
  file: File | Blob,
): Promise<unknown> {
  const blob =
    file instanceof File ? new Blob([file], { type: file.type }) : file;
  const result = await agent.com.atproto.repo.uploadBlob(blob);
  return result.data.blob;
}
