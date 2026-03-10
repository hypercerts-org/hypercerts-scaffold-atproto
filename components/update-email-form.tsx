"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { requestEmailUpdate, updateEmail } from "@/lib/create-actions";

type Step = "request" | "confirm" | "success";

export default function UpdateEmailForm({
  currentEmail,
}: {
  currentEmail: string;
}) {
  const [step, setStep] = useState<Step>("request");
  const [token, setToken] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");

  const requestMutation = useMutation({
    mutationFn: () => requestEmailUpdate(),
    onSuccess: () => {
      toast.success("Verification code sent to your email.");
      setStep("confirm");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to send verification code.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ email, tok }: { email: string; tok: string }) =>
      updateEmail(email, tok),
    onSuccess: () => {
      toast.success("Email updated successfully.");
      setStep("success");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update email.");
    },
  });

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestMutation.mutate();
  };

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail !== confirmEmail) {
      toast.error("Emails do not match");
      return;
    }
    updateMutation.mutate({ email: newEmail, tok: token });
  };

  if (step === "success") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="size-8 text-green-600" />
            </div>
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              Email updated
            </h2>
            <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm">
              Your email has been updated successfully.
            </p>
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
            <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm">
              We sent a verification code to{" "}
              <strong className="text-foreground">{currentEmail}</strong>. Enter
              it below with your new email.
            </p>
            <div className="space-y-2">
              <Label htmlFor="token">Verification code</Label>
              <Input
                id="token"
                type="text"
                placeholder="Enter verification code"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">New email</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="new@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-email">Confirm new email</Label>
              <Input
                id="confirm-email"
                type="email"
                placeholder="new@example.com"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={
                updateMutation.isPending ||
                !token.trim() ||
                !newEmail.trim() ||
                !confirmEmail.trim()
              }
            >
              {updateMutation.isPending ? "Updating..." : "Update Email"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={requestMutation.isPending}
              onClick={() => requestMutation.mutate()}
            >
              {requestMutation.isPending
                ? "Sending..."
                : "Resend verification code"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // step === "request"
  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-email">Current email</Label>
            <Input
              id="current-email"
              type="email"
              value={currentEmail}
              readOnly
              className={cn("bg-muted/50 cursor-not-allowed")}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={requestMutation.isPending}
          >
            {requestMutation.isPending
              ? "Sending..."
              : "Send Verification Code"}
          </Button>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground w-full text-center font-[family-name:var(--font-outfit)] text-sm underline-offset-4 hover:underline"
            onClick={() => setStep("confirm")}
          >
            Already have a code?
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
