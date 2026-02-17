"use client";

import { FormEventHandler, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useEmailLoginMutation } from "@/queries/auth";

export default function EmailLoginForm() {
  const [email, setEmail] = useState("");
  const emailLoginMutation = useEmailLoginMutation();

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    emailLoginMutation.mutate(email);
  };

  return (
    <form onSubmit={handleSubmit} className="grid w-full max-w-sm gap-6 py-10">
      <div className="space-y-2 animate-fade-in-up">
        <h2 className="text-2xl font-[family-name:var(--font-syne)] font-bold text-foreground">
          Sign In
        </h2>
        <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
          Enter your email to continue
        </p>
      </div>

      <div className="animate-fade-in-up [animation-delay:100ms] space-y-3">
        <Input
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="font-[family-name:var(--font-outfit)] glass-panel border-border/50 focus-within:border-create-accent transition-colors"
        />
      </div>

      <div className="animate-fade-in-up [animation-delay:200ms] space-y-3">
        <Button
          type="submit"
          disabled={emailLoginMutation.isPending}
          className="w-full bg-create-accent hover:bg-create-accent/90 text-white font-[family-name:var(--font-outfit)] font-medium transition-all"
        >
          {emailLoginMutation.isPending && <Spinner />}
          Continue
        </Button>
      </div>

      {emailLoginMutation.isError && (
        <p className="text-sm text-destructive font-[family-name:var(--font-outfit)]">
          {emailLoginMutation.error instanceof Error
            ? emailLoginMutation.error.message
            : "An error occurred. Please try again."}
        </p>
      )}
    </form>
  );
}
