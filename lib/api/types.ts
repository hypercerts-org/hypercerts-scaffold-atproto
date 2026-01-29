/**
 * Shared API types for the application
 */

import type { CreateHypercertResult } from "@hypercerts-org/sdk-core";

// Auth types
export interface LoginRequest {
  handle: string;
}

export interface LoginResponse {
  authUrl: string;
}

// Hypercert types
export interface CreateHypercertRequest {
  title: string;
  shortDescription: string;
  description?: string;
  startDate: string;
  endDate: string;
  rights: {
    name: string;
    type: string;
    description: string;
  };
  workScope: {
    withinAllOf?: string[];
    withinAnyOf?: string[];
    withinNoneOf?: string[];
  };
  image?: File;
}

export type CreateHypercertResponse = CreateHypercertResult;

// Location parameter for attachments - can be a string (AT-URI) or full location creation params
export type AttachmentLocationParam =
  | string
  | {
      lpVersion: string;
      srs: string;
      locationType: string;
      location: string | File;
      name?: string;
      description?: string;
    };

export interface AddAttachmentRequest {
  title: string;
  shortDescription: string;
  description?: string;
  contentType?: string;
  hypercertUri: string;
  evidenceMode: "link" | "file";
  evidenceUrl?: string;
  evidenceFile?: File;
  location?: AttachmentLocationParam;
}

export interface AddAttachmentResponse {
  success: boolean;
}

export interface AddLocationRequest {
  lpVersion: string;
  srs: string;
  locationType: string;
  createdAt: string;
  name?: string;
  description?: string;
  contentMode: "link" | "file";
  locationUrl?: string;
  locationFile?: File;
  hypercertUri: string;
}

export interface AddLocationResponse {
  success: boolean;
}

// Profile types
export interface UpdateProfileRequest {
  displayName?: string | null;
  description?: string | null;
  pronouns?: string | null;
  website?: string | null;
  avatar?: File | null;
  banner?: File | null;
}

export interface UpdateProfileResponse {
  ok: boolean;
  profile: {
    displayName?: string;
    description?: string;
    pronouns?: string;
    website?: string;
    avatar?: string;
    banner?: string;
  };
}

// External API types - Constellation
export interface BacklinksResponse {
  records: {
    did: string;
    collection: string;
    rkey: string;
  }[];
}

// External API types - Bluesky
export interface BlueskyProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
}

export interface BlueskySearchActorsResponse {
  actors: BlueskyProfile[];
}

// Handle availability check
export interface HandleCheckResponse {
  available: boolean;
}
