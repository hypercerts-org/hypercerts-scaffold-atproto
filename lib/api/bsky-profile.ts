/**
 * Bsky Profile API functions
 */

import { apiClientFormData } from "./client";
import type { UpdateBskyProfileResponse } from "./types";

/**
 * Update user Bluesky profile
 */
export async function updateBskyProfile(params: {
  displayName?: string | null;
  description?: string | null;
  avatar?: File | null;
  banner?: File | null;
}): Promise<UpdateBskyProfileResponse> {
  const formData = new FormData();

  if (params.displayName !== undefined) {
    formData.set("displayName", params.displayName || "");
  }
  if (params.description !== undefined) {
    formData.set("description", params.description || "");
  }
  if (params.avatar) {
    formData.set("avatar", params.avatar);
  }
  if (params.banner) {
    formData.set("banner", params.banner);
  }

  return apiClientFormData<UpdateBskyProfileResponse>(
    "/api/profile/bsky/update",
    formData,
  );
}
