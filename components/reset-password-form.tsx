"use client";

import { FormEvent, useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useRequestPasswordResetMutation } from "@/queries/auth/use-request-password-reset-mutation";
import { useResetPasswordMutation } from "@/queries/auth/use-reset-password-mutation";

export default function ResetPasswordForm({
  initialEmail,
}: {
  initialEmail: string;
}) {
  const [step, setStep] = useState<"request" | "confirm" | "success">(
    "request",
  );
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const requestMutation = useRequestPasswordResetMutation();
  const resetMutation = useResetPasswordMutation();

  const handleRequestSubmit = (e: FormEvent) => {
    e.preventDefault();
    requestMutation.mutate(email.trim(), {
      onSuccess: () => {
        setStep("confirm");
      },
    });
  };

  const handleResetSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    resetMutation.mutate(
      { token, password },
      {
        onSuccess: () => {
          setStep("success");
        },
      },
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
            <h3 className="mb-2 text-lg font-semibold">
              Password reset complete
            </h3>
            <p className="text-muted-foreground text-sm">
              Your password has been updated. You can now log in with your new
              password.
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
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <p className="text-muted-foreground mb-4 text-sm">
              We sent a reset code to{" "}
              <span className="text-foreground font-medium">{email}</span>.
              Enter it below with your new password.
            </p>
            <div className="space-y-2">
              <Label htmlFor="token">Reset code</Label>
              <Input
                id="token"
                type="text"
                placeholder="Paste your reset code"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={
                resetMutation.isPending ||
                !token.trim() ||
                !password ||
                !confirmPassword
              }
            >
              {resetMutation.isPending ? "Resetting..." : "Reset Password"}
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
              onClick={() => requestMutation.mutate(email)}
            >
              {requestMutation.isPending ? "Resending..." : "Resend reset code"}
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
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly={!!initialEmail}
              className={cn(
                !!initialEmail && "bg-muted/50 cursor-not-allowed pr-10",
              )}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={requestMutation.isPending || !email.trim()}
          >
            {requestMutation.isPending ? "Sending..." : "Send Reset Link"}
          </Button>
          <div className="text-center">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
              onClick={() => {
                if (!email.trim()) {
                  toast.error("Please enter your email address first");
                  return;
                }
                setStep("confirm");
              }}
            >
              Already have a reset code?
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
