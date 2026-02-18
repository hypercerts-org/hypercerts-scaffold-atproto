"use client";
import { AtSignIcon, ArrowLeftIcon } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "./ui/button";
import { FormEventHandler, useState } from "react";
import { Spinner } from "./ui/spinner";
import { useLoginMutation } from "@/queries/auth";

export default function LoginDialog() {
  const [handle, setHandle] = useState("");
  const [showAtProto, setShowAtProto] = useState(false);
  const loginMutation = useLoginMutation();

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    loginMutation.mutate({ handle });
  };

  const handleCertifiedSignIn = () => {
    loginMutation.mutate({ mode: "certified" as const });
  };

  if (showAtProto) {
    return (
      <form onSubmit={handleSubmit} className="grid w-full max-w-sm gap-6 py-10">
        <div className="space-y-2 animate-fade-in-up">
          <h2 className="text-2xl font-[family-name:var(--font-syne)] font-bold text-foreground">
            Sign in with ATProto
          </h2>
          <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
            Enter your handle to continue
          </p>
        </div>

        <div className="animate-fade-in-up [animation-delay:100ms] space-y-3">
          <InputGroup className="glass-panel border-border/50 focus-within:border-create-accent transition-colors">
            <InputGroupAddon className="text-create-accent">
              <AtSignIcon />
            </InputGroupAddon>
            <InputGroupInput
              onChange={(e) => setHandle(e.target.value)}
              placeholder="kzoeps.bsky.social"
              className="font-[family-name:var(--font-outfit)] bg-transparent"
            />
          </InputGroup>
        </div>

        <div className="animate-fade-in-up [animation-delay:200ms] space-y-3">
          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-create-accent hover:bg-create-accent/90 text-white font-[family-name:var(--font-outfit)] font-medium transition-all"
          >
            {loginMutation.isPending && <Spinner />}
            Sign In
          </Button>
          <button
            type="button"
            onClick={() => setShowAtProto(false)}
            className="flex items-center gap-1 text-sm font-[family-name:var(--font-outfit)] text-muted-foreground hover:text-create-accent transition-colors"
          >
            <ArrowLeftIcon className="w-3 h-3" />
            Back
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="grid w-full max-w-sm gap-6 py-10">
      <div className="space-y-2 animate-fade-in-up">
        <h2 className="text-2xl font-[family-name:var(--font-syne)] font-bold text-foreground">
          Sign In
        </h2>
        <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
          Sign in to your account
        </p>
      </div>

      <div className="animate-fade-in-up [animation-delay:100ms] space-y-3">
        <Button
          type="button"
          disabled={loginMutation.isPending}
          onClick={handleCertifiedSignIn}
          className="w-full bg-create-accent hover:bg-create-accent/90 text-white font-[family-name:var(--font-outfit)] font-medium transition-all"
        >
          {loginMutation.isPending && <Spinner />}
          Sign in
        </Button>
        <button
          type="button"
          onClick={() => setShowAtProto(true)}
          className="w-full text-sm font-[family-name:var(--font-outfit)] text-muted-foreground hover:text-create-accent transition-colors text-center"
        >
          Use an ATProto handle instead
        </button>
      </div>
    </div>
  );
}
