"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequestEmailUpdateMutation } from "@/queries/auth/use-request-email-update-mutation";
import { useUpdateEmailMutation } from "@/queries/auth/use-update-email-mutation";

export default function UpdateEmailForm({
  initialEmail,
}: {
  initialEmail: string;
}) {
  const [step, setStep] = useState<"request" | "confirm" | "success">(
    "request",
  );
  const [token, setToken] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const requestMutation = useRequestEmailUpdateMutation();
  const updateMutation = useUpdateEmailMutation();

  const handleRequestSubmit = (e: FormEvent) => {
    e.preventDefault();
    requestMutation.mutate(undefined, {
      onSuccess: () => setStep("confirm"),
    });
  };

  const handleConfirmSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(
      { token: token.trim(), email: newEmail.trim() },
      { onSuccess: () => setStep("success") },
    );
  };

  if (step === "success") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100">
              <Check className="size-6 text-green-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Email updated</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Your email address has been updated to{" "}
              <span className="text-foreground font-medium">{newEmail}</span>.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/profile">Back to profile</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "confirm") {
    return (
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleConfirmSubmit} className="space-y-4">
            <p className="text-muted-foreground mb-4 text-sm">
              We sent a token to{" "}
              <span className="text-foreground font-medium">
                {initialEmail}
              </span>
              . Enter it below along with your new email address.
            </p>
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <Input
                id="token"
                type="text"
                placeholder="Paste your token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEmail">New email address</Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="you@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={
                updateMutation.isPending || !token.trim() || !newEmail.trim()
              }
            >
              {updateMutation.isPending ? "Updating..." : "Update email"}
            </Button>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card text-muted-foreground px-2">or</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={requestMutation.isPending}
              onClick={() => requestMutation.mutate()}
            >
              {requestMutation.isPending ? "Resending..." : "Resend token"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <p className="text-muted-foreground text-sm">
            A token will be sent to your current address{" "}
            <span className="text-foreground font-medium">{initialEmail}</span>.
            Use it to update your email.
          </p>
          <Button
            type="submit"
            className="w-full"
            disabled={requestMutation.isPending}
          >
            {requestMutation.isPending ? "Sending..." : "Request email update"}
          </Button>
          <div className="text-center">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
              onClick={() => setStep("confirm")}
            >
              Already have a token?
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
