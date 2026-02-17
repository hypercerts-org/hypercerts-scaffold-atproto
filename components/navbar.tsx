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
import { AtSignIcon, LogOut, User, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEventHandler, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLoginMutation, useLogoutMutation } from "@/queries/auth";

export interface NavbarProps {
  isSignedIn: boolean;
  avatarUrl?: string;
  handle?: string;
  userDid?: string;
  activeDid?: string;
  activeProfileName?: string;
  activeProfileHandle?: string;
}

export default function Navbar({
  isSignedIn,
  avatarUrl,
  handle: userHandle,
  activeProfileName,
  activeProfileHandle,
}: NavbarProps) {
  const [handle, setHandle] = useState("");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();

  const isLoading = loginMutation.isPending || logoutMutation.isPending;

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    loginMutation.mutate(handle, {
      onSuccess: () => {
        setOpen(false);
        setHandle("");
      },
    });
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const fallback = userHandle?.slice(0, 2).toUpperCase() || "ME";

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 glass-panel">
      <div className="flex h-16 items-center justify-between px-6 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-create-accent/15 flex items-center justify-center group-hover:bg-create-accent/25 transition-colors">
            <Sparkles className="h-4 w-4 text-create-accent" />
          </div>
          <span className="text-lg font-[family-name:var(--font-syne)] font-bold tracking-tight">
            Hypercerts
          </span>
        </Link>

        {/* Navigation Links + Auth */}
        <div className="flex items-center gap-6">
          {isSignedIn ? (
            <>
              {/* Nav Links */}
              <div className="hidden md:flex items-center gap-1">
                <Link
                  href="/hypercerts"
                  className={`px-3 py-1.5 text-sm font-[family-name:var(--font-outfit)] font-medium rounded-lg transition-colors ${
                    pathname === "/hypercerts" ||
                    (pathname?.startsWith("/hypercerts") &&
                      pathname !== "/hypercerts/create")
                      ? "bg-create-accent/10 text-create-accent hover:bg-create-accent/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  Hypercerts
                </Link>
                <Link
                  href="/hypercerts/create"
                  className={`px-3 py-1.5 text-sm font-[family-name:var(--font-outfit)] font-medium rounded-lg transition-colors ${
                    pathname === "/hypercerts/create"
                      ? "bg-create-accent/10 text-create-accent hover:bg-create-accent/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  Create
                </Link>
              </div>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="rounded-full focus:outline-none focus:ring-2 focus:ring-create-accent focus:ring-offset-2"
                    aria-label="Open user menu"
                  >
                    <Avatar className="h-9 w-9 ring-2 ring-border hover:ring-create-accent/50 transition-all">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="bg-create-accent/15 text-create-accent font-[family-name:var(--font-syne)] font-semibold">
                        {fallback}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-56 glass-panel border-border/60"
                >
                  <DropdownMenuLabel className="flex flex-col gap-1">
                    <span className="text-sm font-[family-name:var(--font-outfit)] font-semibold">
                      My Account
                    </span>
                    {userHandle && (
                      <span className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground">
                        @{userHandle}
                      </span>
                    )}
                  </DropdownMenuLabel>

                  {activeProfileName && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-wider font-[family-name:var(--font-outfit)] font-medium text-muted-foreground">
                          Active Profile
                        </span>
                        <span className="text-sm font-[family-name:var(--font-outfit)] font-semibold">
                          {activeProfileName}
                        </span>
                        {activeProfileHandle && (
                          <span className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground">
                            @{activeProfileHandle}
                          </span>
                        )}
                      </DropdownMenuLabel>
                    </>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem className="font-[family-name:var(--font-outfit)]">
                    <Link
                      className="flex items-center gap-2 w-full"
                      href="/profile"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    disabled={isLoading}
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive font-[family-name:var(--font-outfit)]"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {logoutMutation.isPending ? "Logging out..." : "Log out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  disabled={isLoading}
                  size="sm"
                  className="bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground font-[family-name:var(--font-outfit)] font-medium shadow-sm"
                >
                  Sign In
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-80 glass-panel border-border/60"
              >
                <form onSubmit={handleSubmit} className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="text-base font-[family-name:var(--font-syne)] font-bold">
                      Welcome back
                    </h4>
                    <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
                      Enter your handle to continue
                    </p>
                  </div>
                  <InputGroup>
                    <InputGroupInput
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="your.handle"
                      required
                      className="font-[family-name:var(--font-outfit)]"
                    />
                    <InputGroupAddon>
                      <AtSignIcon />
                    </InputGroupAddon>
                  </InputGroup>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={loginMutation.isPending}
                      className="bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground font-[family-name:var(--font-outfit)] font-medium"
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                    <Button
                      variant="link"
                      type="button"
                      size="sm"
                      className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground hover:text-foreground"
                    >
                      Create an account
                    </Button>
                  </div>
                </form>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </nav>
  );
}
