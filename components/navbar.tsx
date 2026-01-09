"use client";

import { AtSignIcon } from "lucide-react";
import { useState, FormEventHandler } from "react";
import { useUserHandle } from "@/queries/use-user-handle";
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
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Spinner } from "./ui/spinner";

export default function Navbar({ isSignedIn }: { isSignedIn: boolean }) {
  const userHandle = useUserHandle();
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ handle }),
      });
      const data = await response.json();
      router.push(data.authUrl);
      setOpen(false);
      setHandle("");
    } catch (e) {
      console.error(e);
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const redirectToAccountCreation = () => {
    setOpen(false);
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/logout`);
      if (res.ok) {
        router.refresh();
      } else {
        toast.error("Logout failed");
      }
    } catch (e) {
      console.error("logout failed", e);
      toast.error("logout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center justify-end gap-3 px-4 max-w-7xl mx-auto">
        {isSignedIn ? (
          <div className="gap-4 flex items-center">
            <Link href={`/create`} className="underline hover:text-gray-500">
              Create
            </Link>
            <Link href={`/profile`} className="underline hover:text-gray-500">
              Profile
            </Link>
            <Link
              href={`/my-hypercerts`}
              className="underline hover:text-gray-500"
            >
              My Hypercerts
            </Link>
            {userHandle && (
              <span className="text-sm text-muted-foreground">
                @{userHandle}
              </span>
            )}
            <Button
              disabled={loading}
              onClick={handleLogout}
              variant="outline"
              size="sm"
            >
              {loading && <Spinner />}
              Logout
            </Button>
          </div>
        ) : (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button disabled={loading} variant="default" size="sm">
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
