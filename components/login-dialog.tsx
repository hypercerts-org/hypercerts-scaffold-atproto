"use client";
import { AtSignIcon, MailIcon, ArrowLeftIcon } from "lucide-react";
import { useState, FormEventHandler } from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import { useLoginMutation } from "@/queries/auth";

// ─── Handle Login Form ───────────────────────────────────────────────────────

function HandleLoginForm({ onBack }: { onBack?: () => void }) {
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
    <form onSubmit={handleSubmit} className="w-full">
      <div className="stagger-children space-y-5">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="animate-pill-slide-in inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-[family-name:var(--font-outfit)] font-medium bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all border border-white/15 hover:border-white/30"
          >
            <ArrowLeftIcon className="size-3" />
            Switch to Email
          </button>
        )}

        <div className="space-y-1">
          <h2 className="text-2xl font-[family-name:var(--font-syne)] font-bold text-white tracking-tight">
            Handle
          </h2>
          <p className="text-sm font-[family-name:var(--font-outfit)] text-white/60">
            Sign in with your ATProto identity
          </p>
        </div>

        <div className="space-y-3">
          <InputGroup className="bg-white/10 border-white/20 focus-within:border-white/50 transition-colors">
            <InputGroupAddon className="text-white/60">
              <AtSignIcon />
            </InputGroupAddon>
            <InputGroupInput
              onChange={(e) => setHandle(e.target.value)}
              value={handle}
              placeholder="kzoeps.bsky.social"
              className="font-[family-name:var(--font-outfit)] bg-transparent text-white placeholder:text-white/30"
            />
          </InputGroup>
        </div>

        <div className="space-y-2">
          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-white text-create-accent hover:bg-white/90 font-[family-name:var(--font-outfit)] font-semibold transition-all"
          >
            {loginMutation.isPending && <Spinner />}
            Sign In
          </Button>
          <Button
            disabled={loginMutation.isPending}
            onClick={redirectToAccountCreation}
            variant="ghost"
            type="button"
            className="w-full font-[family-name:var(--font-outfit)] text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            Create an account
          </Button>
        </div>
      </div>
    </form>
  );
}

// ─── Email Login Form ────────────────────────────────────────────────────────

function EmailLoginForm({ onBack }: { onBack?: () => void }) {
  const [email, setEmail] = useState("");

  const handleContinue = () => {
    const url = email
      ? `/api/oauth/login?email=${encodeURIComponent(email)}`
      : `/api/oauth/login`;
    window.location.href = url;
  };

  return (
    <div className="w-full">
      <div className="stagger-children space-y-5">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="animate-pill-slide-in inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-[family-name:var(--font-outfit)] font-medium bg-create-accent/8 hover:bg-create-accent/15 text-create-accent/70 hover:text-create-accent transition-all border border-create-accent/15 hover:border-create-accent/30"
          >
            <ArrowLeftIcon className="size-3" />
            Switch to Handle
          </button>
        )}

        <div className="space-y-1">
          <h2 className="text-2xl font-[family-name:var(--font-syne)] font-bold text-foreground tracking-tight">
            Email
          </h2>
          <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
            Sign in with a one-time code
          </p>
        </div>

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
            Enter your email to skip straight to the code, or leave blank
          </p>
        </div>

        <Button
          type="button"
          onClick={handleContinue}
          className="w-full bg-create-accent hover:bg-create-accent/90 text-white font-[family-name:var(--font-outfit)] font-semibold transition-all"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

// ─── Door Selection ──────────────────────────────────────────────────────────

function DoorSelection({
  onSelect,
}: {
  onSelect: (door: "handle" | "email") => void;
}) {
  return (
    <div className="flex gap-3 w-full min-h-[260px]">
      {/* Handle Door — dark/charcoal */}
      <button
        type="button"
        onClick={() => onSelect("handle")}
        className="
          relative flex-1 rounded-xl overflow-hidden
          bg-create-accent noise-bg
          flex flex-col items-center justify-center gap-3 p-6
          border border-white/10
          hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20
          hover:border-white/20
          transition-all duration-200 ease-out
          group cursor-pointer
          text-left
        "
      >
        <div className="relative z-10 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/15 transition-colors">
            <AtSignIcon className="size-6 text-white" />
          </div>
          <div>
            <div className="text-lg font-[family-name:var(--font-syne)] font-bold text-white tracking-tight">
              Handle
            </div>
            <div className="text-xs font-[family-name:var(--font-outfit)] text-white/55 mt-0.5 leading-relaxed">
              Sign in with your<br />ATProto identity
            </div>
          </div>
        </div>
      </button>

      {/* Email Door — light/warm */}
      <button
        type="button"
        onClick={() => onSelect("email")}
        className="
          relative flex-1 rounded-xl overflow-hidden
          glass-panel
          flex flex-col items-center justify-center gap-3 p-6
          hover:-translate-y-1 hover:shadow-xl hover:shadow-create-accent/10
          hover:border-create-accent/30
          transition-all duration-200 ease-out
          group cursor-pointer
          text-left
        "
        style={{
          background:
            "linear-gradient(135deg, oklch(0.99 0.003 80 / 0.9), oklch(0.97 0.008 60 / 0.85))",
        }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-lg bg-create-accent/8 flex items-center justify-center group-hover:bg-create-accent/15 transition-colors">
            <MailIcon className="size-6 text-create-accent" />
          </div>
          <div>
            <div className="text-lg font-[family-name:var(--font-syne)] font-bold text-foreground tracking-tight">
              Email
            </div>
            <div className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground mt-0.5 leading-relaxed">
              Sign in with a<br />one-time code
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

// ─── Expanded Door ───────────────────────────────────────────────────────────

function ExpandedDoor({
  selected,
  onBack,
}: {
  selected: "handle" | "email";
  onBack: () => void;
}) {
  const isHandle = selected === "handle";

  return (
    <div
      className={`
        animate-expand-door
        relative rounded-xl overflow-hidden p-7 w-full
        ${isHandle ? "bg-create-accent noise-bg" : ""}
      `}
      style={
        !isHandle
          ? {
              background:
                "linear-gradient(135deg, oklch(0.99 0.003 80 / 0.9), oklch(0.97 0.008 60 / 0.85))",
              border: "1px solid oklch(0.92 0.005 260 / 0.6)",
            }
          : undefined
      }
    >
      <div className="relative z-10">
        {isHandle ? (
          <HandleLoginForm onBack={onBack} />
        ) : (
          <EmailLoginForm onBack={onBack} />
        )}
      </div>
    </div>
  );
}

// ─── Main LoginDialog ────────────────────────────────────────────────────────

export default function LoginDialog() {
  const [selectedDoor, setSelectedDoor] = useState<"handle" | "email" | null>(
    null
  );
  const hasEpds = !!process.env.NEXT_PUBLIC_EPDS_URL;

  // If no ePDS configured, skip doors and show handle form directly
  if (!hasEpds) {
    return (
      <div className="w-full px-2 py-4">
        <div className="space-y-2 mb-6 animate-fade-in-up">
          <h2 className="text-2xl font-[family-name:var(--font-syne)] font-bold text-foreground">
            Sign In
          </h2>
          <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
            Enter your handle to continue
          </p>
        </div>
        <div className="animate-fade-in-up [animation-delay:80ms]">
          <HandleLoginFormStandalone />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-2">
      {selectedDoor === null ? (
        <div className="animate-door-fade-in space-y-4">
          <div className="space-y-1 px-1">
            <h2 className="text-xl font-[family-name:var(--font-syne)] font-bold text-foreground">
              Choose how to sign in
            </h2>
            <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
              Pick the path that feels right for you
            </p>
          </div>
          <DoorSelection onSelect={setSelectedDoor} />
        </div>
      ) : (
        <div className="animate-expand-door">
          <ExpandedDoor
            selected={selectedDoor}
            onBack={() => setSelectedDoor(null)}
          />
        </div>
      )}
    </div>
  );
}

// ─── Standalone Handle Form (no ePDS) ───────────────────────────────────────

function HandleLoginFormStandalone() {
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
    <form onSubmit={handleSubmit} className="grid w-full gap-5">
      <div className="space-y-3">
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
      </div>

      <div className="space-y-2">
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
