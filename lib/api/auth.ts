/**
 * Auth API functions
 */

import { apiClient } from "./client";
import type { LoginRequest, LoginResponse } from "./types";

/**
 * Initiate login flow
 */
export async function login(handle: string): Promise<LoginResponse> {
  return apiClient<LoginResponse>("/api/oauth/login", {
    method: "POST",
    body: { handle } satisfies LoginRequest,
  });
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  await apiClient<void>("/api/oauth/logout", {
    method: "GET",
  });
}
