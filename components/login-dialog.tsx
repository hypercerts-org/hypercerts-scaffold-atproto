"use client";
import { AtSignIcon } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "./ui/button";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { FormEventHandler, useState } from "react";
import { PDS_URL } from "@/utils/constants";

export default function LoginDialog() {
  const [handle, setHandle] = useState("");
  const { signIn } = useOAuthContext();

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    signIn(handle);
  };

  const redirectToAccountCreation = () => {
    signIn(PDS_URL);
  };
  return (
    <form onSubmit={handleSubmit} className="grid w-full max-w-sm gap-6 py-10">
      <InputGroup>
        <InputGroupInput
          onChange={(e) => setHandle(e.target.value)}
          placeholder="Enter your handle"
        />
        <InputGroupAddon>
          <AtSignIcon />
        </InputGroupAddon>
      </InputGroup>

      <Button type="submit">Login</Button>
      <Button
        onClick={redirectToAccountCreation}
        variant={"link"}
        type="button"
      >
        Create an account
      </Button>
    </form>
  );
}
