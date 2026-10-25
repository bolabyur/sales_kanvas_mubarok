import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Batch, BatchPayload } from "../types/batch.types";

const URL = "/master/batch";
const KEY = ["master", "batch"];

// PERBAIKAN: Ubah dari useBatches menjadi useBatch
export function useBatches() {
  return useQuery({ queryKey: KEY, queryFn: () => api<Batch[]>(URL) });
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