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
      <InputGroup>
        <InputGroupAddon>
          <AtSignIcon />
        </InputGroupAddon>
        <InputGroupInput
          onChange={(e) => setHandle(e.target.value)}
          placeholder="Enter your handle"
        />
      </InputGroup>
      {hostname && (
        <p className="text-sm text-muted-foreground">
          Handle: {handle}.{hostname}
        </p>
      )}

      <Button type="submit" disabled={loginMutation.isPending}>
        {loginMutation.isPending && <Spinner />}
        Login
      </Button>
      <Button
        disabled={loginMutation.isPending}
        onClick={redirectToAccountCreation}
        variant={"link"}
        type="button"
      >
        Create an account
      </Button>
    </form>
  );
}
