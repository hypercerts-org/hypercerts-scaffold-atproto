"use client";
import useDebounce from "@/lib/use-debounce";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { useEffect, useState } from "react";
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

export interface UserSelectionProps {
  onUserSelect: (profile: ProfileView) => void;
}

export default function UserSelection({ onUserSelect }: UserSelectionProps) {
  const { atProtoAgent } = useOAuthContext();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [userSuggestions, setUserSuggestions] = useState<ProfileView[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedSearch.trim() || !atProtoAgent) {
        setUserSuggestions([]);
        return;
      }

      try {
        setIsLoading(true);
        const res = await atProtoAgent.app.bsky.actor.searchActors({
          q: debouncedSearch,
          limit: 10,
        });
        const actors = res?.data.actors;
        setUserSuggestions(actors || []);
      } catch (error) {
        console.error("Error fetching actors:", error);
        setUserSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearch, atProtoAgent]);

  const handleSelect = (profile: ProfileView) => {
    onUserSelect(profile);
    setSearch("");
    setUserSuggestions([]);
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
              <CommandItem onSelect={() => handleSelect(user)} key={user.did}>
                <UserAvatar user={user} />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandSeparator />
      </CommandList>
    </Command>
  );
}
