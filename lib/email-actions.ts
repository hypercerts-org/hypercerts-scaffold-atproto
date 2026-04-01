"use server";

import { getAgent } from "@/lib/atproto-session";

/**
 * Request an email confirmation to be sent to the user's registered address.
 * Calls com.atproto.server.requestEmailConfirmation on the user's PDS.
 * Requires an active authenticated session (account:email scope).
 */
export async function requestEmailConfirmation(): Promise<void> {
  const agent = await getAgent();
  if (!agent) {
    throw new Error("Not authenticated");
  }

  await agent.com.atproto.server.requestEmailConfirmation();
}

/**
 * Confirm the user's email address using a token received via email.
 * Calls com.atproto.server.confirmEmail on the user's PDS.
 * Requires an active authenticated session (account:email scope).
 */
export async function confirmEmail(
  email: string,
  token: string,
): Promise<void> {
  const agent = await getAgent();
  if (!agent) {
    throw new Error("Not authenticated");
  }

  await agent.com.atproto.server.confirmEmail({ email, token });
}

/**
 * Request an email update token to be sent to the user's current address.
 * Calls com.atproto.server.requestEmailUpdate on the user's PDS.
 * Requires an active authenticated session (account:email scope).
 */
export async function requestEmailUpdate(): Promise<void> {
  const agent = await getAgent();
  if (!agent) {
    throw new Error("Not authenticated");
  }

  await agent.com.atproto.server.requestEmailUpdate();
}

/**
 * Update the user's email address using a token received via email.
 * Calls com.atproto.server.updateEmail on the user's PDS.
 * Requires an active authenticated session (account:email scope).
 */
export async function updateEmail(token: string, email: string): Promise<void> {
  const agent = await getAgent();
  if (!agent) {
    throw new Error("Not authenticated");
  }

  await agent.com.atproto.server.updateEmail({ token, email });
}
