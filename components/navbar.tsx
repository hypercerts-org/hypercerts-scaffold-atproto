"use client";

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
import { AtSignIcon, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEventHandler, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface NavbarProps {
  isSignedIn: boolean;
  avatarUrl?: string;
  handle?: string;
}

export default function Navbar({
  isSignedIn,
  avatarUrl,
  handle: userHandle,
}: NavbarProps) {
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
  const fallback = userHandle?.slice(0, 2).toUpperCase() || "ME";

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center justify-end gap-3 px-4 max-w-7xl mx-auto">
        {isSignedIn ? (
          <div className="gap-4 flex items-center">
            <Link href={`/create`} className="underline hover:text-gray-500">
              Create
            </Link>
            <Link
              href={`/my-hypercerts`}
              className="underline hover:text-gray-500"
            >
              My Hypercerts
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label="Open user menu"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>{fallback}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="flex flex-col gap-1">
                  <span className="text-sm font-medium">My Account</span>
                  {userHandle && (
                    <span className="text-xs text-muted-foreground">
                      @{userHandle}
                    </span>
                  )}
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem>
                  <Link className="flex gap-2" href={`/profile`}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  disabled={loading}
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {loading ? "Logging out..." : "Log out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
