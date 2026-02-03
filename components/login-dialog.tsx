"use client";
import { AtSignIcon } from "lucide-react";

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
  const loginMutation = useLoginMutation();

  const pdsUrl = process.env.NEXT_PUBLIC_PDS_URL;
  let hostname = "";
  if (pdsUrl) {
    try {
      hostname = new URL(pdsUrl).hostname;
    } catch (e) {
      console.error("Invalid PDS URL:", pdsUrl, e);
    }
  }

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    let finalHandle = handle;
    if (hostname && !handle.includes(hostname)) {
      const cleanHandle = handle.endsWith(".") ? handle.slice(0, -1) : handle;
      finalHandle = `${cleanHandle}.${hostname}`;
    }

    loginMutation.mutate(finalHandle);
  };

  const redirectToAccountCreation = () => {
    if (!process.env.NEXT_PUBLIC_PDS_URL) {
      throw new Error("NEXT_PUBLIC_PDS_URL is not defined");
    }
    loginMutation.mutate(process.env.NEXT_PUBLIC_PDS_URL);
  };

  return (
    <form onSubmit={handleSubmit} className="grid w-full max-w-sm gap-6 py-10">
      <div className="space-y-2 animate-fade-in-up">
        <h2 className="text-2xl font-[family-name:var(--font-syne)] font-bold text-foreground">
          Sign In
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
            placeholder="Enter your handle"
            className="font-[family-name:var(--font-outfit)] bg-transparent"
          />
        </InputGroup>
        {hostname && (
          <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground px-1">
            Full handle: <span className="text-create-accent font-medium">{handle || "..."}.{hostname}</span>
          </p>
        )}
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
        <Button
          disabled={loginMutation.isPending}
          onClick={redirectToAccountCreation}
          variant={"ghost"}
          type="button"
          className="w-full font-[family-name:var(--font-outfit)] text-muted-foreground hover:text-create-accent hover:bg-muted/50 transition-colors"
        >
          Create an account
        </Button>
      </div>
    </form>
  );
}
