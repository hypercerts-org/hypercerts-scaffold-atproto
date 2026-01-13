"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { listOrgs, switchActiveProfile } from "@/lib/create-actions";
import { Organization } from "@hypercerts-org/sdk-core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BuildingIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface ProfileSwitchDialogProps {
  children: React.ReactNode;
  personalHandle: string;
  currentActiveDid: string;
  userDid: string;
}

export default function ProfileSwitchDialog({
  children,
  personalHandle,
  userDid,
  currentActiveDid,
}: ProfileSwitchDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["organizations-for-profile-switch"],
    queryFn: async () => {
      const orgsResult = await listOrgs();
      return orgsResult?.organizations || [];
    },
    enabled: isOpen,
  });

  const organizations: Organization[] = data || [];

  const mutation = useMutation({
    mutationFn: (did: string) => switchActiveProfile(did),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["active-profile"],
      });
      router.refresh();
      setIsOpen(false);
    },
    onError: (error) => {
      console.error("Failed to switch profile", error);
      toast.error("Failed to switch profile, please try again");
    },
  });

  const handleSwitchProfile = (did: string) => {
    mutation.mutate(did);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Switch Profile</DialogTitle>
          <DialogDescription>
            Select the profile you want to operate as.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          {isLoading ? (
            <p>Loading organizations...</p>
          ) : isError ? (
            <p className="text-red-500">Failed to load organizations.</p>
          ) : (
            <div className="space-y-2">
              {/* Personal Profile */}
              <div className="flex items-center justify-between space-x-3 p-2 border rounded-md">
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                  <span>{personalHandle} (Personal)</span>
                </div>
                {userDid === currentActiveDid ? (
                  <span className="text-sm font-semibold text-blue-600 px-3">
                    Current
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSwitchProfile(userDid)}
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending && mutation.variables === userDid
                      ? "Switching..."
                      : "Switch"}
                  </Button>
                )}
              </div>

              {/* Organizations */}
              {organizations.map((org) => (
                <div
                  key={org.did}
                  className="flex items-center justify-between space-x-3 p-2 border rounded-md"
                >
                  <div className="flex items-center space-x-2">
                    <BuildingIcon className="h-5 w-5 text-gray-500" />
                    <span>{org.name}</span>
                  </div>
                  {currentActiveDid === org.did ? (
                    <span className="text-sm font-semibold text-blue-600 px-3">
                      Current
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSwitchProfile(org.did)}
                      disabled={mutation.isPending}
                    >
                      {mutation.isPending && mutation.variables === org.did
                        ? "Switching..."
                        : "Switch"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
