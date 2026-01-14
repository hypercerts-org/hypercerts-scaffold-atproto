"use client";

import {
  addCollaboratorToOrganization,
  GrantAccessParams,
} from "@/lib/create-actions";
import { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { OrganizationInfo, RepositoryRole } from "@hypercerts-org/sdk-core";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import FormInfo from "./form-info";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import UserAvatar from "./user-avatar";
import UserSelection from "./user-selection";

interface AddContributorsFormProps {
  orgInfo: OrganizationInfo;
}

type UserMode = "search" | "did";

export default function AddContributorsForm({
  orgInfo,
}: AddContributorsFormProps) {
  const [selectedUserDid, setSelectedUserDid] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ProfileView | null>(
    null
  );

  const [userMode, setUserMode] = useState<UserMode>("search");
  const [rawDid, setRawDid] = useState("");

  const [selectedRole, setSelectedRole] = useState<RepositoryRole>("editor");

  const didIsValid = () => {
    const v = rawDid.trim();
    if (!v) return false;
    // did:<method>:<id>
    // method: lowercase letters/digits
    // id: conservative allowed chars
    return /^did:[a-z0-9]+:[A-Za-z0-9._:%-]+$/.test(v);
  };

  const mutation = useMutation({
    mutationFn: (params: GrantAccessParams) =>
      addCollaboratorToOrganization(params),
    onSuccess: () => {
      toast.success("Contributor added successfully!");
      setSelectedUserDid(null);
      setSelectedProfile(null);
      setRawDid("");
      setUserMode("search");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to add contributor");
    },
  });

  const handleUserSelect = (user: ProfileView) => {
    setSelectedProfile(user);
    setSelectedUserDid(user.did);
    setRawDid("");
    setUserMode("search");
  };

  const clearSelection = () => {
    setSelectedUserDid(null);
    setSelectedProfile(null);
    setRawDid("");
  };

  const handleSubmit = () => {
    if (!selectedUserDid) {
      toast.error("Please select a user");
      return;
    }

    mutation.mutate({
      userDid: selectedUserDid,
      role: selectedRole,
      repoDid: orgInfo.did,
    });
  };

  return (
    <FormInfo
      title="Add Contributors"
      description={`Add members to your organization: ${orgInfo.name}`}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>User</Label>

          <Tabs
            value={userMode}
            onValueChange={(mode) => setUserMode(mode as UserMode)}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="did">Enter DID</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="pt-2">
              <UserSelection onUserSelect={handleUserSelect} />
            </TabsContent>

            <TabsContent value="did" className="pt-2 space-y-2">
              <div className="space-y-1">
                <Label className="text-sm text-gray-600 dark:text-gray-400">
                  Paste a DID (e.g.{" "}
                  <span className="font-mono">did:plc:...</span>)
                </Label>

                <Input
                  value={rawDid}
                  onChange={(e) => {
                    const inputDid = e.target.value;
                    setRawDid(inputDid);

                    const trimmed = inputDid.trim();
                    if (trimmed.length) {
                      // If user is entering a DID, clear any profile selection to enforce "one selected user"
                      setSelectedProfile(null);
                    }
                    if (/^did:[a-z0-9]+:[A-Za-z0-9._:%-]+$/.test(trimmed)) {
                      setSelectedUserDid(trimmed);
                    } else {
                      setSelectedUserDid(null);
                    }
                  }}
                  placeholder="did:plc:xxxxxxxxxxxxxxxxxxxx"
                  className={
                    rawDid
                      ? didIsValid()
                        ? "border-green-500"
                        : "border-red-500"
                      : ""
                  }
                />

                {rawDid ? (
                  didIsValid() ? (
                    <p className="text-sm text-green-600">DID looks valid.</p>
                  ) : (
                    <p className="text-sm text-red-600">
                      That doesn’t look like a valid DID.
                    </p>
                  )
                ) : null}
              </div>
            </TabsContent>
          </Tabs>

          {selectedProfile && (
            <div className="pt-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selected user:
              </p>

              <div className="flex items-center space-x-2 border rounded-md p-2 mt-1">
                <UserAvatar user={selectedProfile} />

                <Button
                  type="button"
                  variant="ghost"
                  className="ml-auto"
                  onClick={clearSelection}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Role</Label>
          <RadioGroup
            value={selectedRole}
            onValueChange={(role) => setSelectedRole(role as RepositoryRole)}
            className="space-y-2"
          >
            <div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="viewer" id="viewer" />
                <Label htmlFor="viewer">Viewer</Label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                Can view the organization&apos;s hypercerts.
              </p>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="editor" id="contributor" />
                <Label htmlFor="contributor">Contributor</Label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                Can create and manage hypercerts for the organization.
              </p>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin">Admin</Label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                Can manage organization settings and members.
              </p>
            </div>
          </RadioGroup>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!selectedUserDid || mutation.isPending}
          >
            {mutation.isPending ? "Adding..." : "Add Contributor"}
          </Button>
        </div>
      </div>
    </FormInfo>
  );
}
