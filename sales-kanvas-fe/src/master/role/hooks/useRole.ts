import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner"; 
import { api } from "@/lib/api";
import type { Role, RolePayload, Permission } from "../types/role.types";

const URL = "/master/role";
const KEY = ["master", "role"];

export function useRoles() {
  return useQuery({ queryKey: KEY, queryFn: () => api<Role[]>(URL) });
}

export function usePermissions() {
  return useQuery({ queryKey: ["master", "permission"], queryFn: () => api<Permission[]>("/master/permission") });
}

export function useSaveRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: RolePayload & { id?: number }) =>
      api<Role>(id ? `${URL}/${id}` : URL, { method: id ? "PATCH" : "POST", body: JSON.stringify(payload) }),
    onSuccess: (_, variables) => {
      toast.success(variables.id ? "Role berhasil diperbarui" : "Role berhasil ditambahkan");
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`${URL}/${id}`, { method: "DELETE" }),

    onSuccess: () => {
      toast.success("Role berhasil dihapus");
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}