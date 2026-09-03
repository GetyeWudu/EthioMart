/**
 * frontend/features/auth/hooks/use-current-user.ts
 * ===============================================
 * SWR Hook for retrieving the currently logged-in user profile & suspension state.
 */

"use client";

import useSWR from "swr";
import { authService } from "../services/auth-service";
import { User } from "../types";

export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR(
    "/auth/me/",
    async () => {
      try {
        const res = await authService.getMe();
        return res.user;
      } catch {
        return null;
      }
    },
    {
      revalidateOnFocus: true,
      dedupingInterval: 10000,
      shouldRetryOnError: false,
    }
  );

  return {
    user: (data ?? null) as User | null,
    isLoading,
    isSuspended: data ? !data.is_active : false,
    mutate,
  };
}
