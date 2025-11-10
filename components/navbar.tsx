"use client";

import { AtSignIcon } from "lucide-react";
import { useState, FormEventHandler } from "react";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PDS_URL } from "@/utils/constants";

export default function Navbar() {
  const { isSignedIn, signIn, signOut, isLoading } = useOAuthContext();
  const [handle, setHandle] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    await signIn(handle);
    setOpen(false);
    setHandle("");
  };

  const redirectToAccountCreation = () => {
    signIn(PDS_URL);
    setOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-end px-4 max-w-7xl mx-auto">
        {isSignedIn ? (
          <Button
            onClick={handleLogout}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Logout
          </Button>
        ) : (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="default" size="sm" disabled={isLoading}>
                Login
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Sign in</h4>
                  <p className="text-sm text-muted-foreground">
                    Enter your handle to continue
                  </p>
                </div>
                <InputGroup>
                  <InputGroupInput
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="Enter your handle"
                    required
                  />
                  <InputGroupAddon>
                    <AtSignIcon />
                  </InputGroupAddon>
                </InputGroup>
                <div className="flex flex-col gap-2">
                  <Button type="submit" size="sm">
                    Login
                  </Button>
                  <Button
                    onClick={redirectToAccountCreation}
                    variant="link"
                    type="button"
                    size="sm"
                    className="text-xs"
                  >
                    Create an account
                  </Button>
                </div>
              </form>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </nav>
  );
}

