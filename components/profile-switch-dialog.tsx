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
import { queryKeys } from "@/lib/api/query-keys";
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
    queryKey: queryKeys.organizations.forProfileSwitch(),
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
        queryKey: queryKeys.profile.active(),
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
      <DialogContent className="max-w-4xl w-full max-h-[80vh] flex flex-col sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Switch Profile</DialogTitle>
          <DialogDescription>
            Select the profile you want to operate as.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading organizations...
          </div>
        ) : isError ? (
          <div className="py-8 text-center text-destructive">
            Failed to load organizations.
          </div>
        ) : (
          <div className="overflow-y-auto pr-2 -mr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Personal Profile */}
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{personalHandle}</p>
                    <p className="text-sm text-muted-foreground">Personal</p>
                  </div>
                </div>
                {userDid === currentActiveDid ? (
                  <span className="text-sm font-medium text-blue-500 ml-2 shrink-0">
                    Current
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSwitchProfile(userDid)}
                    disabled={mutation.isPending}
                    className="ml-2 shrink-0"
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
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <BuildingIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{org.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Organization
                      </p>
                    </div>
                  </div>
                  {currentActiveDid === org.did ? (
                    <span className="text-sm font-medium text-blue-500 ml-2 shrink-0">
                      Current
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSwitchProfile(org.did)}
                      disabled={mutation.isPending}
                      className="ml-2 shrink-0"
                    >
                      {mutation.isPending && mutation.variables === org.did
                        ? "Switching..."
                        : "Switch"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
