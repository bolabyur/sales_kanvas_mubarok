import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { Gudang, GudangPayload } from "../types/gudang.types";

const URL = "/master/gudang";
const KEY = ["master", "gudang"];

export function useGudang() { return useQuery({ queryKey: KEY, queryFn: () => api<Gudang[]>(URL) }); }
export function useSaveGudang() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: GudangPayload & { id?: number }) => api<Gudang>(id ? `${URL}/${id}` : URL, { method: id ? "PATCH" : "POST", body: JSON.stringify(payload) }),
    onSuccess: () => { toast.success("Berhasil disimpan!"); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e) => { if (e instanceof ApiError) toast.error(e.message); },
  });
}
export function useDeleteGudang() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`${URL}/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast.success("Berhasil dihapus!"); qc.invalidateQueries({ queryKey: KEY }); },
  });
}