/**
 * Shared API types for the application
 */

import type { CreateHypercertResult, UpdateResult } from "@/lib/types";

// Auth types
export interface LoginRequest {
  handle: string;
}

export interface LoginResponse {
  authUrl: string;
}

// Hypercert types
export type CreateHypercertResponse = CreateHypercertResult;

export interface UpdateHypercertRequest {
  hypercertUri: string;
  title?: string;
  shortDescription?: string;
  description?: string;
  startDate?: string | null; // null = clear date
  endDate?: string | null; // null = clear date
  image?: File | null; // null = remove image
}

export type UpdateHypercertResponse = UpdateResult;

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

export interface AddAttachmentResponse {
  success: boolean;
}

export interface AddLocationResponse {
  success: boolean;
}

// Profile types
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

// Bsky Profile types
export interface UpdateBskyProfileResponse {
  ok: boolean;
  profile: {
    displayName?: string;
    description?: string;
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
