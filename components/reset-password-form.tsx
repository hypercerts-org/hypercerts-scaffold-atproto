"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequestPasswordResetMutation } from "@/queries/auth/use-request-password-reset-mutation";

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const mutation = useRequestPasswordResetMutation();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate(email.trim(), {
      onSuccess: () => {
        setEmail("");
      },
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending || !email.trim()}
          >
            {mutation.isPending ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
