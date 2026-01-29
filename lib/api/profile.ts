/**
 * Profile API functions
 */

import { apiClientFormData } from "./client";
import type { UpdateProfileResponse } from "./types";

/**
 * Update user profile
 */
export async function updateProfile(params: {
  displayName: string;
  description: string;
  avatar?: File;
  banner?: File;
}): Promise<UpdateProfileResponse> {
  const formData = new FormData();
  formData.set("displayName", params.displayName);
  formData.set("description", params.description);

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
