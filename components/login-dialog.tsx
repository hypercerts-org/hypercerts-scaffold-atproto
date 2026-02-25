"use client";
import { AtSignIcon, MailIcon } from "lucide-react";
import { useState, FormEventHandler } from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import { useLoginMutation } from "@/queries/auth";

// ─── Pill Toggle ─────────────────────────────────────────────────────────────

type Tab = "handle" | "email";
export type AuthMode = "signin" | "signup";

function PillToggle({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <div className="flex w-full rounded-full bg-muted p-1">
      <button
        type="button"
        onClick={() => onChange("handle")}
        className={`flex-1 rounded-full px-4 py-1.5 text-sm font-[family-name:var(--font-outfit)] font-medium transition-all duration-200 ${
          active === "handle"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Handle
      </button>
      <button
        type="button"
        onClick={() => onChange("email")}
        className={`flex-1 rounded-full px-4 py-1.5 text-sm font-[family-name:var(--font-outfit)] font-medium transition-all duration-200 ${
          active === "email"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Email
      </button>
    </div>
  );
}

// ─── Handle Form ──────────────────────────────────────────────────────────────

function HandleForm() {
  const [handle, setHandle] = useState("");
  const loginMutation = useLoginMutation();

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    loginMutation.mutate(handle);
  };

  const redirectToAccountCreation = () => {
    if (!process.env.NEXT_PUBLIC_PDS_URL) {
      throw new Error("NEXT_PUBLIC_PDS_URL is not defined");
    }
    loginMutation.mutate(process.env.NEXT_PUBLIC_PDS_URL);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 animate-fade-in">
      <InputGroup className="glass-panel border-border/50 focus-within:border-create-accent transition-colors">
        <InputGroupAddon className="text-create-accent">
          <AtSignIcon />
        </InputGroupAddon>
        <InputGroupInput
          onChange={(e) => setHandle(e.target.value)}
          value={handle}
          placeholder="kzoeps.bsky.social"
          className="font-[family-name:var(--font-outfit)] bg-transparent"
        />
      </InputGroup>

      <div className="animate-fade-in-up [animation-delay:200ms] space-y-3">
        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full bg-create-accent hover:bg-create-accent/90 text-white font-[family-name:var(--font-outfit)] font-medium transition-all"
        >
          {loginMutation.isPending && <Spinner />}
          Sign In
        </Button>
        <Button
          disabled={loginMutation.isPending}
          onClick={redirectToAccountCreation}
          variant="ghost"
          type="button"
          className="w-full font-[family-name:var(--font-outfit)] text-muted-foreground hover:text-create-accent hover:bg-muted/50 transition-colors"
        >
          Create an account
        </Button>
      </div>
    </form>
  );
}

// ─── Email Form ───────────────────────────────────────────────────────────────

function EmailForm({
  mode,
  setMode,
}: {
  mode: AuthMode;
  setMode: (m: AuthMode) => void;
}) {
  const [email, setEmail] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleContinue = () => {
    setIsRedirecting(true);
    const url = email
      ? `/api/oauth/login?email=${encodeURIComponent(email)}`
      : `/api/oauth/login`;
    window.location.href = url;
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleContinue();
      }}
      className="w-full space-y-3 animate-fade-in"
    >
      <div className="space-y-2">
        <InputGroup className="glass-panel border-border/50 focus-within:border-create-accent transition-colors">
          <InputGroupAddon className="text-create-accent/70">
            <MailIcon />
          </InputGroupAddon>
          <InputGroupInput
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            placeholder="you@example.com"
            className="font-[family-name:var(--font-outfit)] bg-transparent"
          />
        </InputGroup>
        <p className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground px-1">
          {mode === "signup"
            ? "Enter your email to create your account"
            : "Enter your email for a direct code, or continue without"}
        </p>
      </div>

      <div className="space-y-2">
        <Button
          type="submit"
          disabled={isRedirecting}
          className="w-full bg-create-accent hover:bg-create-accent/90 text-white font-[family-name:var(--font-outfit)] font-semibold transition-all"
        >
          {isRedirecting && <Spinner />}
          {mode === "signup" ? "Create Account" : "Continue"}
        </Button>
        <Button
          type="button"
          disabled={isRedirecting}
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          variant="ghost"
          className="w-full font-[family-name:var(--font-outfit)] text-muted-foreground hover:text-create-accent hover:bg-muted/50 transition-colors"
        >
          {mode === "signup"
            ? "Already have an account? Sign in"
            : "Don\u0027t have an account? Create one"}
        </Button>
      </div>
    </form>
  );
}

// ─── Main LoginDialog ─────────────────────────────────────────────────────────

export default function LoginDialog({
  initialMode = "signin",
}: { initialMode?: AuthMode } = {}) {
  const [activeTab, setActiveTab] = useState<Tab>("handle");
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const hasEpds = !!process.env.NEXT_PUBLIC_EPDS_URL;

  return (
    <div className="w-full max-w-sm space-y-5">
      <div>
        <h2 className="text-xl font-[family-name:var(--font-syne)] font-bold text-foreground tracking-tight">
          {mode === "signup" ? "Create Account" : "Sign In"}
        </h2>
        <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
          {mode === "signup"
            ? "Get started with your account"
            : "Choose how to continue"}
        </p>
      </div>

      {/* Only show PillToggle in signin mode when ePDS is available */}
      {mode === "signin" && hasEpds && (
        <PillToggle active={activeTab} onChange={setActiveTab} />
      )}

      {/* In signup mode, always show EmailForm. In signin mode, show based on activeTab */}
      {mode === "signup" ? (
        <EmailForm mode={mode} setMode={setMode} />
      ) : activeTab === "handle" || !hasEpds ? (
        <HandleForm />
      ) : (
        <EmailForm mode={mode} setMode={setMode} />
      )}
    </div>
  );
}
