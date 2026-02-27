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
    <div className="bg-muted flex w-full rounded-full p-1">
      <button
        type="button"
        onClick={() => onChange("handle")}
        className={`flex-1 rounded-full px-4 py-1.5 font-[family-name:var(--font-outfit)] text-sm font-medium transition-all duration-200 ${
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
        className={`flex-1 rounded-full px-4 py-1.5 font-[family-name:var(--font-outfit)] text-sm font-medium transition-all duration-200 ${
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
    <form onSubmit={handleSubmit} className="animate-fade-in w-full space-y-3">
      <InputGroup className="glass-panel border-border/50 focus-within:border-create-accent transition-colors">
        <InputGroupAddon className="text-create-accent">
          <AtSignIcon />
        </InputGroupAddon>
        <InputGroupInput
          onChange={(e) => setHandle(e.target.value)}
          value={handle}
          placeholder="kzoeps.bsky.social"
          className="bg-transparent font-[family-name:var(--font-outfit)]"
        />
      </InputGroup>

      <div className="animate-fade-in-up space-y-3 [animation-delay:200ms]">
        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className="bg-create-accent hover:bg-create-accent/90 w-full font-[family-name:var(--font-outfit)] font-medium text-white transition-all"
        >
          {loginMutation.isPending && <Spinner />}
          Sign In
        </Button>
        <Button
          disabled={loginMutation.isPending}
          onClick={redirectToAccountCreation}
          variant="ghost"
          type="button"
          className="text-muted-foreground hover:text-create-accent hover:bg-muted/50 w-full font-[family-name:var(--font-outfit)] transition-colors"
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
      ? `/api/oauth/epds/login?email=${encodeURIComponent(email)}`
      : `/api/oauth/epds/login`;
    window.location.href = url;
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleContinue();
      }}
      className="animate-fade-in w-full space-y-3"
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
            className="bg-transparent font-[family-name:var(--font-outfit)]"
          />
        </InputGroup>
        <p className="text-muted-foreground px-1 font-[family-name:var(--font-outfit)] text-xs">
          {mode === "signup"
            ? "Enter your email to create your account"
            : "Enter your email for a direct code, or continue without"}
        </p>
      </div>

      <div className="space-y-2">
        <Button
          type="submit"
          disabled={isRedirecting}
          className="bg-create-accent hover:bg-create-accent/90 w-full font-[family-name:var(--font-outfit)] font-semibold text-white transition-all"
        >
          {isRedirecting && <Spinner />}
          {mode === "signup" ? "Create Account" : "Continue"}
        </Button>
        <Button
          type="button"
          disabled={isRedirecting}
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          variant="ghost"
          className="text-muted-foreground hover:text-create-accent hover:bg-muted/50 w-full font-[family-name:var(--font-outfit)] transition-colors"
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
        <h2 className="text-foreground font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight">
          {mode === "signup" ? "Create Account" : "Sign In"}
        </h2>
        <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm">
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
