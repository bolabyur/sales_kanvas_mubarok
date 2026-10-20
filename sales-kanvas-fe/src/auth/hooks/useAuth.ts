import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, tokens } from "@/lib/api";
import type { LoginPayload, LoginResponse, User } from "../types/auth.types";

export const ME_KEY = ["me"];

export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async (): Promise<User | null> => {
      if (!tokens.access()) return null;
      try {
        return await api<User>("/auth/me");
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          tokens.clear();
          return null;
        }
        throw e;
      }
    },
    staleTime: Infinity,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      api<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      tokens.set(data.access_token, data.refresh_token);
      qc.setQueryData(ME_KEY, data.user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api("/auth/logout", { method: "POST" }).catch(() => null),
    onSettled: () => {
      tokens.clear();
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== ME_KEY[0] });
      qc.setQueryData(ME_KEY, null);
    },
  });
}
