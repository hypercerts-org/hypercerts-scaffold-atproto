"use client";

import useDebounce from "@/lib/use-debounce";
import type { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./ui/command";
import UserAvatar from "./user-avatar";
import { useUserSearchQuery } from "@/queries/external";

export interface UserSelectionProps {
  onUserSelect: (profile: ProfileView) => void;
}

const EMPTY_PROFILES: ProfileView[] = [];

export default function UserSelection({ onUserSelect }: UserSelectionProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: userSuggestions = EMPTY_PROFILES, isLoading } =
    useUserSearchQuery(debouncedSearch);

  const handleSelect = (profile: ProfileView) => {
    onUserSelect(profile);
    setSearch("");
  };

  return (
    <Command className="shadow-xs border " shouldFilter={false}>
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder="Search for users..."
      />
      <CommandList>
        {isLoading && <CommandEmpty>Loading...</CommandEmpty>}
        {!isLoading && userSuggestions.length === 0 && !!search && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        {!isLoading && !!userSuggestions.length && (
          <CommandGroup heading="Suggestions">
            {userSuggestions.map((user) => (
              <CommandItem
                onSelect={() => handleSelect(user as ProfileView)}
                key={user.did}
              >
                <UserAvatar user={user as ProfileView} />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandSeparator />
      </CommandList>
    </Command>
  );
}
