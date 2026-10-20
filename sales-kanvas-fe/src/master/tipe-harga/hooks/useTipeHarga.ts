import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { TipeHarga, TipeHargaPayload } from "../types/tipe-harga.types";

const URL = "/master/tipe-harga";
const KEY = ["master", "tipe-harga"];

export function useTipeHarga() {
  return useQuery({ queryKey: KEY, queryFn: () => api<TipeHarga[]>(URL) });
}

export function useSaveTipeHarga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: TipeHargaPayload & { id?: number }) =>
      api<TipeHarga>(id ? `${URL}/${id}` : URL, {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => { toast.success("Berhasil disimpan!"); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e) => { if (e instanceof ApiError) toast.error(e.message); },
  });
}

export function useDeleteTipeHarga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`${URL}/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast.success("Berhasil dihapus!"); qc.invalidateQueries({ queryKey: KEY }); },
  });
}