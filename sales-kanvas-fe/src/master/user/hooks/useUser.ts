import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner"; 
import { api } from "@/lib/api";
import type { User, UserPayload } from "../types/user.types";

const URL = "/master/user";
const KEY = ["master", "user"];

export function useUsers() {
  return useQuery({ queryKey: KEY, queryFn: () => api<User[]>(URL) });
}

export function useSaveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UserPayload & { id?: number }) =>
      api<User>(id ? `${URL}/${id}` : URL, {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_, variables) => {
      toast.success(variables.id ? "User berhasil diperbarui" : "User berhasil ditambahkan");
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`${URL}/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("User berhasil dihapus");
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}