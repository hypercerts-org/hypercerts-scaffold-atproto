"use client";
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
import useDebounce from "@/lib/use-debounce";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";

export default function UserSelection() {
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
        console.log("Fetched actors:", actors); // Debug log
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

  return (
    <Command shouldFilter={false}>
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder="Search for users..."
      />
      <CommandList>
        {isLoading ? (
          <CommandEmpty>Loading...</CommandEmpty>
        ) : userSuggestions.length === 0 ? (
          <CommandEmpty>No results found.</CommandEmpty>
        ) : (
          <CommandGroup heading="Suggestions">
            {userSuggestions.map((user) => (
              <CommandItem key={user.did}>
                {user.displayName || user.handle}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandSeparator />
      </CommandList>
    </Command>
  );
}
