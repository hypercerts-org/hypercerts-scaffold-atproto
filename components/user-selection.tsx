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
import Image from "next/image";

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
              <CommandItem className="flex gap-4 items-center" key={user.did}>
                {!!user.avatar && (
                  <Image
                    src={user.avatar}
                    width={32}
                    height={32}
                    alt="avatar"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                {!user.avatar && (
                  <div className="flex justify-center items-center rounded-full w-8 h-8 bg-gray-500 text-white">
                    {user.displayName?.[0].toUpperCase() ||
                      user.handle?.[0].toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <span className="text-sm">{user.displayName}</span>
                  <span className="text-xs">{user.handle}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandSeparator />
      </CommandList>
    </Command>
  );
}
