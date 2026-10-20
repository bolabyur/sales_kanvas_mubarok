import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  KasbonMaterialType,
  KasbonMaterialTypePayload,
} from "../types/kasbonMaterialType.types";

const URL = "/master/kasbon-material-type";
const KEY = ["master", "kasbon-material-type"];

export function useKasbonMaterialTypes() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api<KasbonMaterialType[]>(URL),
  });
}

export function useSaveKasbonMaterialType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: KasbonMaterialTypePayload & { id?: number }) =>
      api<KasbonMaterialType>(id ? `${URL}/${id}` : URL, {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteKasbonMaterialType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`${URL}/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
