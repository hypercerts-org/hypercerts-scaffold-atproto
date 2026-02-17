import { redirect } from "next/navigation";
import { getSession } from "@/lib/atproto-session";
import EmailLoginForm from "@/components/email-login-form";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  return (
    <div className="flex grow flex-col items-center justify-center">
      <EmailLoginForm />
    </div>
  );
}
