"use server";

import { redirect } from "next/navigation";
import sdk, { sessionStore, stateStore } from "./hypercerts-sdk";
export const login = async (handle: string) => {
  console.log("Logging in user with handle:", handle);
  const authURL = await sdk.authorize(handle);
  console.log("Session Store", sessionStore);
  console.log("State Store", stateStore);
  console.log("Auth URL:", authURL);
  console.log("authorize page show");
  redirect(authURL);
};
