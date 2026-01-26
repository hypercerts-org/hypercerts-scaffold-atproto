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
import { AtSignIcon, LogOut, User, GlobeIcon } from "lucide-react";
import Link from "next/link";
import { FormEventHandler, useState } from "react";
import ProfileSwitchDialog from "./profile-switch-dialog";

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
  userDid,
  activeDid,
  activeProfileName,
  activeProfileHandle,
}: NavbarProps) {
  const [handle, setHandle] = useState("");
  const [open, setOpen] = useState(false);

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
    <nav className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center justify-end gap-3 px-4 max-w-7xl mx-auto">
        {isSignedIn ? (
          <div className="gap-4 flex items-center">
            <Link
              href={`/organizations`}
              className="underline hover:text-gray-500"
            >
              Organizations
            </Link>
            <Link
              href={`/organizations/create`}
              className="underline hover:text-gray-500"
            >
              Create Organization
            </Link>
            <Link
              href={`/hypercerts/create`}
              className="underline hover:text-gray-500"
            >
              Create Hypercert
            </Link>
            <Link
              href={`/hypercerts`}
              className="underline hover:text-gray-500"
            >
              View Hypercerts
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

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-1">
                  <span className="text-sm font-medium">My Account</span>
                  {userHandle && (
                    <span className="text-xs text-muted-foreground">
                      @{userHandle}
                    </span>
                  )}
                </DropdownMenuLabel>
                {activeProfileName && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        Active Profile
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {activeProfileName}
                      </span>
                      {activeProfileHandle && (
                        <span className="text-xs text-muted-foreground">
                          @{activeProfileHandle}
                        </span>
                      )}
                    </DropdownMenuLabel>
                  </>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem>
                  <Link className="flex gap-2" href={`/profile`}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Profile Switch Dialog Trigger */}
                {userDid && userHandle && (
                  <ProfileSwitchDialog
                    personalHandle={userHandle}
                    currentActiveDid={activeDid || userDid}
                    userDid={userDid}
                  >
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      {" "}
                      {/* Prevent dropdown close on trigger click */}
                      <button className="flex gap-2 w-full text-left">
                        <GlobeIcon className="mr-2 h-4 w-4" />
                        Switch Profile
                      </button>
                    </DropdownMenuItem>
                  </ProfileSwitchDialog>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  disabled={isLoading}
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {logoutMutation.isPending ? "Logging out..." : "Log out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button disabled={isLoading} variant="default" size="sm">
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
                  <Button type="submit" size="sm" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Logging in..." : "Login"}
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
