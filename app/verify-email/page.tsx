import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAgent } from "@/lib/atproto-session";
import VerifyEmailForm from "@/components/verify-email-form";
import { MailCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your email address to secure your account.",
};

export default async function VerifyEmailPage() {
  const agent = await getAgent();
  if (!agent) redirect("/");

  const sessionInfo = await agent.com.atproto.server
    .getSession()
    .catch(() => null);
  const email = sessionInfo?.data?.email || "";
  const emailConfirmed = sessionInfo?.data?.emailConfirmed ?? true;

  if (emailConfirmed) redirect("/profile");

  return (
    <div className="noise-bg relative min-h-screen">
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 lg:py-12">
        {/* Page header */}
        <div className="animate-fade-in mb-8 lg:mb-10">
          <div className="mb-2 flex items-center gap-3">
            <div className="bg-create-accent/10 flex size-10 items-center justify-center rounded-full">
              <MailCheck className="text-create-accent size-5" />
            </div>
            <h1 className="text-foreground font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight lg:text-4xl">
              Verify Email
            </h1>
          </div>
          <p className="text-muted-foreground mt-2 max-w-xl pl-[52px] font-[family-name:var(--font-outfit)] text-sm">
            Confirm your email address. A verification code will be sent to your
            inbox.
          </p>
        </div>

        {/* Main content */}
        <main className="animate-fade-in-up max-w-2xl">
          <VerifyEmailForm initialEmail={email} />
        </main>
      </div>
    </div>
  );
}
