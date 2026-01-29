/**
 * Profile API functions
 */

import { apiClientFormData } from "./client";
import type { UpdateProfileResponse } from "./types";

/**
 * Update user profile
 */
export async function updateProfile(params: {
  displayName?: string | null;
  description?: string | null;
  pronouns?: string | null;
  website?: string | null;
  avatar?: File | null;
  banner?: File | null;
}): Promise<UpdateProfileResponse> {
  const formData = new FormData();
  
  if (params.displayName !== undefined) {
    formData.set("displayName", params.displayName || "");
  }
  if (params.description !== undefined) {
    formData.set("description", params.description || "");
  }
  if (params.pronouns !== undefined) {
    formData.set("pronouns", params.pronouns || "");
  }
  if (params.website !== undefined) {
    formData.set("website", params.website || "");
  }
  if (params.avatar) {
    formData.set("avatar", params.avatar);
  }
  if (params.banner) {
    formData.set("banner", params.banner);
  }

  return apiClientFormData<UpdateProfileResponse>(
    "/api/profile/update",
    formData
  );
}
