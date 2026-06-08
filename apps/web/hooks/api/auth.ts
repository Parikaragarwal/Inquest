import { trpc } from "~/trpc/client";

export function useGetuser() {
  const { data: user, isLoading, isError, error } = trpc.auth.getLoggedInUserInfo.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
  });

  return {
    user: isError ? null : user,
    isLoading,
    isSignedIn: !!user && !isError,
    error,
  };
}
