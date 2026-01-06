import sdk, { sessionStore, stateStore } from "@/lib/hypercerts-sdk";
import { redirect } from "next/navigation";

export async function POST(request: Request) {
  const body = await request.json();
  const handle = body.handle;
  try {
    console.log("loggin in user with handle:", handle);
    const authUrl = await sdk.authorize(handle);
    console.log("Session Store", sessionStore);
    console.log("State Store", stateStore);
    console.log("Auth URL:", authUrl);
    console.log("authorize page show");
    return Response.json({ authUrl });
  } catch (e) {
    console.error("Failed to initiate login process", e);
    return Response.json(
      { error: "Failed to initiate login process" },
      { status: 500 }
    );
  }
}
