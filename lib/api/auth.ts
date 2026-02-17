/**
 * Auth API functions
 */

import { apiClient } from "./client";
import type { EmailLoginRequest, EmailLoginResponse, LoginRequest, LoginResponse } from "./types";

/**
 * Initiate login flow
 */
export async function login(handle: string): Promise<LoginResponse> {
  return apiClient<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { handle } satisfies LoginRequest,
  });
}

/**
 * Initiate email-first login flow
 */
export async function emailLogin(email: string): Promise<EmailLoginResponse> {
  return apiClient<EmailLoginResponse>("/api/auth/email-login", {
    method: "POST",
    body: { email } satisfies EmailLoginRequest,
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
