/**
 * Auth API functions
 */

import { apiClient } from "./client";
import type { LoginRequest, LoginResponse } from "./types";

/**
 * Initiate login flow.
 * Pass { handle } for ATProto handle-based login, or { mode: 'certified' } for Certified auth.
 */
export async function login(request: LoginRequest): Promise<LoginResponse> {
  return apiClient<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: request satisfies LoginRequest,
  });
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  await apiClient<void>("/api/auth/logout", {
    method: "GET",
  });
}
