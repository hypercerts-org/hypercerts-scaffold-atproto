"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Check, Copy, LogOut, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogoutMutation } from "@/queries/auth";
import LoginDialog, { AuthMode } from "@/components/login-dialog";

export interface NavbarProps {
  isSignedIn: boolean;
  avatarUrl?: string;
  handle?: string;
  userDid?: string;
  activeDid?: string;
}

export default function Navbar({
  isSignedIn,
  avatarUrl,
  handle: userHandle,
}: NavbarProps) {
  const pathname = usePathname();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<AuthMode>("signin");
  const [copied, setCopied] = useState(false);

  const logoutMutation = useLogoutMutation();

  const isLoading = logoutMutation.isPending;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const fallback = userHandle?.slice(0, 2).toUpperCase() || "ME";

  return (
    <nav className="border-border/40 glass-panel sticky top-0 z-50 border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2">
          <div className="bg-create-accent/15 group-hover:bg-create-accent/25 flex h-8 w-8 items-center justify-center rounded-lg transition-colors">
            <Sparkles className="text-create-accent h-4 w-4" />
          </div>
          <span className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight">
            Hypercerts
          </span>
        </Link>

        {/* Navigation Links + Auth */}
        <div className="flex items-center gap-6">
          {isSignedIn ? (
            <>
              {/* Nav Links */}
              <div className="hidden items-center gap-1 md:flex">
                <Link
                  href="/hypercerts"
                  className={`rounded-lg px-3 py-1.5 font-[family-name:var(--font-outfit)] text-sm font-medium transition-colors ${
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
                  className={`rounded-lg px-3 py-1.5 font-[family-name:var(--font-outfit)] text-sm font-medium transition-colors ${
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
                    className="focus:ring-create-accent rounded-full focus:ring-2 focus:ring-offset-2 focus:outline-none"
                    aria-label="Open user menu"
                  >
                    <Avatar className="ring-border hover:ring-create-accent/50 h-9 w-9 ring-2 transition-all">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="bg-create-accent/15 text-create-accent font-[family-name:var(--font-syne)] font-semibold">
                        {fallback}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="glass-panel border-border/60 w-56"
                >
                  <DropdownMenuLabel className="flex flex-col gap-1">
                    <span className="font-[family-name:var(--font-outfit)] text-sm font-semibold">
                      My Account
                    </span>
                    {userHandle ? (
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 font-[family-name:var(--font-outfit)] text-xs transition-colors"
                        onClick={() => {
                          navigator.clipboard.writeText(`@${userHandle}`);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        }}
                        title="Copy handle"
                      >
                        @{userHandle}
                        {copied ? (
                          <Check className="size-3 text-green-500" />
                        ) : (
                          <Copy className="size-3 opacity-50" />
                        )}
                      </button>
                    ) : null}
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem className="font-[family-name:var(--font-outfit)]">
                    <Link
                      className="flex w-full items-center gap-2"
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
            <>
              <div className="flex items-center gap-2">
                <Button
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setLoginMode("signup");
                    setDialogOpen(true);
                  }}
                  className="font-[family-name:var(--font-outfit)] font-medium"
                >
                  Create Account
                </Button>
                <Button
                  disabled={isLoading}
                  size="sm"
                  onClick={() => {
                    setLoginMode("signin");
                    setDialogOpen(true);
                  }}
                  className="bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground font-[family-name:var(--font-outfit)] font-medium shadow-sm"
                >
                  Sign In
                </Button>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="glass-panel border-border/60 p-6 sm:max-w-sm">
                  <DialogTitle className="sr-only">
                    {loginMode === "signin" ? "Sign In" : "Create Account"}
                  </DialogTitle>
                  <LoginDialog key={loginMode} initialMode={loginMode} />
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
