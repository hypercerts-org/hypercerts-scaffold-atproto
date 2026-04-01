import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAgent } from "@/lib/atproto-session";
import UpdateEmailForm from "@/components/update-email-form";
import { MailPlus } from "lucide-react";

export const metadata: Metadata = {
  title: "Update Email",
  description: "Request an update to your account email address.",
};

export default async function UpdateEmailPage() {
  const agent = await getAgent();
  if (!agent) redirect("/");

  const sessionInfo = await agent.com.atproto.server
    .getSession()
    .catch(() => null);
  const email = sessionInfo?.data?.email || "";
  const emailConfirmed = sessionInfo?.data?.emailConfirmed ?? false;

  // Only verified accounts can request an email update
  if (!emailConfirmed) redirect("/verify-email");

  return (
    <div className="noise-bg relative min-h-screen">
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 lg:py-12">
        {/* Page header */}
        <div className="animate-fade-in mb-8 lg:mb-10">
          <div className="mb-2 flex items-center gap-3">
            <div className="bg-create-accent/10 flex size-10 items-center justify-center rounded-full">
              <MailPlus className="text-create-accent size-5" />
            </div>
            <h1 className="text-foreground font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight lg:text-4xl">
              Update Email
            </h1>
          </div>
          <p className="text-muted-foreground mt-2 max-w-xl pl-[52px] font-[family-name:var(--font-outfit)] text-sm">
            Request a token to update your account email address.
          </p>
        </div>

        {/* Main content */}
        <main className="animate-fade-in-up max-w-2xl">
          <UpdateEmailForm initialEmail={email} />
        </main>
      </div>
    </div>
  );
}
