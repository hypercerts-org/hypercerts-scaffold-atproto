import { useQuery } from "@tanstack/react-query";
import { useAtprotoClient } from "../lib/use-atproto-client";

export function useGetSessionQuery() {
  const client = useAtprotoClient();

  return useQuery({
    queryKey: ["session", client.assertDid],
    queryFn: async () => {
      const { data } = await client.com.atproto.server.getSession();
      return data;
    },
  });
}
