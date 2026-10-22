import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Permission } from "../types/permission.types";

export function usePermissionList() {
  return useQuery({
    queryKey: ["master", "permission"],
    queryFn: () => api<Permission[]>("/master/permission"),
  });
}