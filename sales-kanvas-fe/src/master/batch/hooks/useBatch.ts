import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Batch, BatchPayload, AdjustStockPayload } from "../types/batch.types";

const URL = "/master/batch";
const KEY = ["master", "batch"];

export function useBatches() {
  return useQuery({ queryKey: KEY, queryFn: () => api<Batch[]>(URL) });
}

export function useBatch(id: number) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => api<Batch>(`${URL}/${id}`),
    enabled: !!id, 
  });
}

export function useSaveBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: BatchPayload & { id?: number }) =>
      api<Batch>(id ? `${URL}/${id}` : URL, {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`${URL}/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: AdjustStockPayload & { id: number }) =>
      api(`${URL}/${id}/adjust`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, variables.id] }); 
      toast.success("Stok berhasil dikoreksi");
    },
    onError: (err: any) => {
      toast.error("Gagal koreksi stok", { description: err.message });
    }
  });
}